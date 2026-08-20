#!/usr/bin/env python3
"""Generate the BeepApp promotional video.

This script renders the storyboard scenes with Pillow and assembles them with
FFmpeg. It intentionally uses only the project assets plus the narration file
already stored in this directory.

Usage:
    python marketing/generate_video.py
    python marketing/generate_video.py --output /tmp/beepapp-promo.mp4

Requirements:
    pip install Pillow
    ffmpeg available on PATH (or set FFMPEG_BIN=/path/to/ffmpeg)

The narration is kept as a separate MP3 because text-to-speech is not a local
video-rendering concern. Pass --no-audio to render a silent version.
"""

from __future__ import annotations

import argparse
import math
import os
import shutil
import subprocess
import tempfile
from pathlib import Path
from typing import Iterable, Sequence

try:
    from PIL import Image, ImageDraw, ImageFont, ImageFilter
except ImportError as exc:  # pragma: no cover - helpful CLI error
    raise SystemExit("Pillow is required. Install it with: pip install Pillow") from exc


ROOT = Path(__file__).resolve().parents[1]
MARKETING = Path(__file__).resolve().parent
ASSETS = ROOT / "src" / "assets"
W, H = 720, 1280
DURATIONS = (5.2, 6.5, 6.5, 7.5, 6.8, 6.0, 5.9, 3.0)
VIDEO_DURATION = sum(DURATIONS)

BLACK = "#090A0D"
BLACK_2 = "#111217"
YELLOW = "#F7C600"
YELLOW_2 = "#FFE56A"
WHITE = "#FAFAF7"
MUTED = "#A6A6A0"
GREEN = "#7BDF9B"
RED = "#FF6961"
BLUE = "#75B9FF"

_FONT_CACHE: dict[tuple[int, bool], ImageFont.FreeTypeFont] = {}


def font(size: int, bold: bool = False) -> ImageFont.FreeTypeFont:
    key = (size, bold)
    if key not in _FONT_CACHE:
        candidates = [
            Path("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf" if bold else "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"),
            Path("/usr/share/fonts/truetype/liberation2/LiberationSans-Bold.ttf" if bold else "/usr/share/fonts/truetype/liberation2/LiberationSans-Regular.ttf"),
        ]
        selected = next((item for item in candidates if item.exists()), None)
        if selected is None:
            raise FileNotFoundError("A TrueType font was not found on this system")
        _FONT_CACHE[key] = ImageFont.truetype(str(selected), size)
    return _FONT_CACHE[key]


def rgb(hex_color: str, alpha: int = 255) -> tuple[int, int, int, int]:
    value = hex_color.lstrip("#")
    if len(value) == 3:
        value = "".join(ch * 2 for ch in value)
    return int(value[0:2], 16), int(value[2:4], 16), int(value[4:6], 16), alpha


def text(draw: ImageDraw.ImageDraw, xy: tuple[float, float], value: str, size: int,
         color: str = WHITE, bold: bool = False, anchor: str = "la", spacing: int | None = None) -> None:
    draw.multiline_text(
        xy,
        value,
        font=font(size, bold),
        fill=rgb(color),
        anchor=anchor,
        spacing=spacing if spacing is not None else max(4, int(size * 0.12)),
    )


def _paint(draw: ImageDraw.ImageDraw, operation, alpha: int) -> None:
    """Paint a semi-transparent shape correctly onto an RGBA image.

    ImageDraw writes RGBA tuples directly and does not blend them with the
    pixels already underneath. Drawing onto a temporary layer first keeps the
    subtle brand glows and card outlines from becoming opaque yellow blocks.
    """
    if alpha >= 255:
        operation(draw)
        return
    target = draw._image  # Pillow exposes the owning Image on ImageDraw.Draw.
    layer = Image.new("RGBA", target.size, (0, 0, 0, 0))
    operation(ImageDraw.Draw(layer))
    target.alpha_composite(layer)


def alpha_text(draw: ImageDraw.ImageDraw, xy: tuple[float, float], value: str, size: int,
               color: str, alpha: int, bold: bool = False, anchor: str = "la") -> None:
    _paint(draw, lambda item: item.multiline_text(
        xy, value, font=font(size, bold), fill=rgb(color, alpha), anchor=anchor
    ), alpha)


def rounded(draw: ImageDraw.ImageDraw, box: tuple[float, float, float, float], fill: str,
            radius: int = 20, outline: str | None = None, width: int = 1, alpha: int = 255) -> None:
    _paint(draw, lambda item: item.rounded_rectangle(
        box, radius=radius, fill=rgb(fill, alpha), outline=rgb(outline) if outline else None, width=width
    ), alpha)


def line(draw: ImageDraw.ImageDraw, points: Sequence[tuple[float, float]], fill: str,
         width: int = 1, alpha: int = 255) -> None:
    _paint(draw, lambda item: item.line(points, fill=rgb(fill, alpha), width=width, joint="curve"), alpha)


def circle(draw: ImageDraw.ImageDraw, center: tuple[float, float], radius: float, fill: str,
           alpha: int = 255, outline: str | None = None, width: int = 1) -> None:
    x, y = center
    _paint(draw, lambda item: item.ellipse(
        (x - radius, y - radius, x + radius, y + radius),
        fill=rgb(fill, alpha), outline=rgb(outline) if outline else None, width=width
    ), alpha)


def fit_cover(image: Image.Image, size: tuple[int, int] = (W, H)) -> Image.Image:
    image = image.convert("RGB")
    scale = max(size[0] / image.width, size[1] / image.height)
    resized = image.resize((round(image.width * scale), round(image.height * scale)), Image.Resampling.LANCZOS)
    left = (resized.width - size[0]) // 2
    top = (resized.height - size[1]) // 2
    return resized.crop((left, top, left + size[0], top + size[1])).convert("RGBA")


def photo_base(path: Path, opacity: int = 235, tint: str | None = None) -> Image.Image:
    base = fit_cover(Image.open(path))
    if opacity < 255:
        layer = Image.new("RGBA", base.size, (0, 0, 0, 0))
        layer.paste(base, (0, 0), base.split()[3].point(lambda p: round(p * opacity / 255)))
        base = layer
    if tint:
        overlay = Image.new("RGBA", base.size, rgb(tint, 52))
        base = Image.alpha_composite(base, overlay)
    return base


def canvas(base: Image.Image | None = None) -> Image.Image:
    return base.copy() if base is not None else Image.new("RGBA", (W, H), rgb(BLACK))


def paste_logo(image: Image.Image, xy: tuple[int, int], width: int) -> None:
    logo = Image.open(ASSETS / "beep-logo.png").convert("RGBA")
    height = round(width * logo.height / logo.width)
    logo = logo.resize((width, height), Image.Resampling.LANCZOS)
    image.alpha_composite(logo, xy)


def header(image: Image.Image, eyebrow: str) -> None:
    draw = ImageDraw.Draw(image)
    paste_logo(image, (40, 38), 35)
    text(draw, (88, 63), eyebrow, 15, WHITE, True)
    line(draw, ((40, 106), (680, 106)), WHITE, 1, 36)


def pill(image: Image.Image, xy: tuple[int, int], width: int, label: str,
         fill: str = YELLOW, color: str = BLACK) -> None:
    draw = ImageDraw.Draw(image)
    x, y = xy
    rounded(draw, (x, y, x + width, y + 34), fill, 17)
    text(draw, (x + width / 2, y + 18), label, 13, color, True, "mm")


def card(image: Image.Image, box: tuple[int, int, int, int], fill: str = "#13151A",
         alpha: int = 255, outline: str = WHITE, outline_alpha: int = 35, radius: int = 22) -> None:
    draw = ImageDraw.Draw(image)
    rounded(draw, box, fill, radius, outline, 1, alpha)
    # A second transparent outline keeps the card readable over photography.
    x1, y1, x2, y2 = box
    _paint(draw, lambda item: item.rounded_rectangle(
        (x1, y1, x2, y2), radius=radius, outline=rgb(outline, outline_alpha), width=1
    ), outline_alpha)


def hex_points(cx: float, cy: float, radius: float) -> list[tuple[float, float]]:
    return [(cx + radius * math.cos(math.radians(60 * i)), cy + radius * math.sin(math.radians(60 * i))) for i in range(6)]


def hex_background() -> Image.Image:
    image = Image.new("RGBA", (W, H), rgb(BLACK))
    draw = ImageDraw.Draw(image)
    for row in range(-1, 25):
        for col in range(-1, 14):
            cx = col * 64 + (32 if row % 2 else 0)
            cy = row * 56
            line(draw, hex_points(cx, cy, 32), WHITE, 1, 14)
    circle(draw, (610, 154), 190, YELLOW, 20)
    circle(draw, (80, 1010), 240, YELLOW, 12)
    for x, y, radius in ((82, 184, 3), (627, 224, 2), (586, 438, 3), (114, 574, 2), (650, 900, 3), (72, 1130, 2), (370, 163, 2)):
        circle(draw, (x, y), radius, YELLOW, 190)
    return image


def add_vertical_gradient(image: Image.Image, top: tuple[int, int, int, int], bottom: tuple[int, int, int, int]) -> None:
    overlay = Image.new("RGBA", image.size, (0, 0, 0, 0))
    pixels = overlay.load()
    height = max(1, image.height - 1)
    for y in range(image.height):
        amount = y / height
        color = tuple(round(top[i] * (1 - amount) + bottom[i] * amount) for i in range(4))
        for x in range(image.width):
            pixels[x, y] = color
    image.alpha_composite(overlay)


def draw_wave(draw: ImageDraw.ImageDraw, x: int, y: int, width: int, color: str = YELLOW) -> None:
    offsets = (0, 12, -14, 27, -9, 19, -22, 7, 0, 14, -10, 24, -5, 18, -17, 8, 0)
    points = [(x + i * width / (len(offsets) - 1), y + value) for i, value in enumerate(offsets)]
    line(draw, points, color, 3)


def scene_intro() -> Image.Image:
    image = hex_background()
    draw = ImageDraw.Draw(image)
    # A soft yellow shape at the bottom gives the opening frame a brand glow.
    _paint(draw, lambda item: item.polygon(
        [(0, 940), (100, 900), (220, 960), (390, 934), (560, 850), (720, 900), (720, 1280), (0, 1280)],
        fill=rgb(YELLOW, 28)
    ), 28)
    circle(draw, (360, 335), 154, YELLOW, 15, YELLOW, 1)
    circle(draw, (360, 335), 120, BLACK, 0, YELLOW, 1)
    paste_logo(image, (279, 218), 162)
    text(draw, (360, 520), "BEEP", 36, YELLOW, True, "ma")
    text(draw, (54, 700), "A TV,\nno seu ritmo.", 58, WHITE, True, "la", 8)
    text(draw, (56, 861), "Assista, interaja e ganhe pontos", 23, MUTED)
    text(draw, (56, 900), "com o BeepApp Mobile.", 23, MUTED)
    pill(image, (56, 1028), 254, "CONHEÇA O BEEPAPP")
    text(draw, (56, 1160), "CONTEÚDO CONECTADO", 13, WHITE, True)
    text(draw, (56, 1192), "RÁDIO  •  TV  •  COMUNIDADE", 14, YELLOW_2)
    return image


def scene_radio() -> Image.Image:
    image = photo_base(ASSETS / "radio-hero.jpg", 235, "#2B160A")
    overlay = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    add_vertical_gradient(overlay, (9, 10, 13, 28), (9, 10, 13, 242))
    image = Image.alpha_composite(image, overlay)
    header(image, "BEEPAPP  /  ÁUDIO")
    pill(image, (40, 142), 242, "RECONHECIMENTO AO VIVO")
    draw = ImageDraw.Draw(image)
    text(draw, (40, 260), "Ouça.\nIdentifique.\nDescubra.", 52, WHITE, True, "la", 8)
    text(draw, (42, 468), "O que está no ar vira", 22, WHITE)
    text(draw, (42, 502), "experiência no seu celular.", 22, YELLOW_2, True)
    card(image, (40, 690, 680, 934), "#0B0C10", 235, WHITE, 45, 24)
    circle(draw, (84, 748), 23, YELLOW)
    text(draw, (84, 756), "R", 22, BLACK, True, "mm")
    text(draw, (124, 738), "RÁDIO CIDADE FM", 14, WHITE, True)
    text(draw, (124, 768), "98.5 FM  •  SÃO PAULO", 13, MUTED)
    draw_wave(draw, 78, 834, 510)
    line(draw, ((78, 859), (642, 859)), WHITE, 1, 38)
    text(draw, (80, 898), "12 faixas identificadas", 15, WHITE, True)
    text(draw, (638, 898), "+20 pts", 16, YELLOW, True, "ra")
    text(draw, (40, 1030), "RECONHEÇA  •  SALVE  •  COMPARTILHE", 14, WHITE, True)
    text(draw, (40, 1073), "Sua programação também conversa com você.", 20, WHITE)
    return image


def scene_tv() -> Image.Image:
    image = photo_base(ASSETS / "tv-hero.jpg", 230, "#0E1420")
    overlay = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    add_vertical_gradient(overlay, (11, 22, 40, 70), (9, 10, 13, 246))
    image = Image.alpha_composite(image, overlay)
    header(image, "BEEPAPP  /  IMAGEM")
    pill(image, (40, 142), 257, "VISÃO COMPUTACIONAL")
    draw = ImageDraw.Draw(image)
    text(draw, (40, 254), "Aponte o\ncelular.\nO BEEP entende\na tela.", 48, WHITE, True, "la", 5)
    text(draw, (42, 528), "Reconhecimento em tempo real", 19, YELLOW_2, True)
    line(draw, ((48, 600), (48, 572), (76, 572)), YELLOW, 5)
    line(draw, ((672, 600), (672, 572), (644, 572)), YELLOW, 5)
    line(draw, ((48, 820), (48, 848), (76, 848)), YELLOW, 5)
    line(draw, ((672, 820), (672, 848), (644, 848)), YELLOW, 5)
    rounded(draw, (80, 640, 640, 758), "#080A0D", 18, YELLOW, 1, 235)
    circle(draw, (111, 679), 16, RED)
    text(draw, (111, 684), "●", 12, WHITE, True, "mm")
    text(draw, (143, 682), "PROGRAMA DETECTADO", 12, MUTED, True)
    text(draw, (105, 725), "Jornal Nacional", 25, WHITE, True)
    text(draw, (632, 725), "+20 pts", 16, YELLOW, True, "ra")
    card(image, (40, 948, 680, 1114), "#0B0C10", 235, WHITE, 40, 22)
    text(draw, (70, 996), "TV GLOBO", 13, BLUE, True)
    text(draw, (70, 1043), "Conteúdo identificado sem interromper", 17, WHITE, True)
    text(draw, (70, 1074), "o que você está assistindo.", 17, WHITE, True)
    text(draw, (642, 1060), "AO VIVO", 11, GREEN, True, "ra")
    return image


def draw_tv_frame(draw: ImageDraw.ImageDraw, x: int, y: int, width: int, height: int) -> None:
    rounded(draw, (x, y, x + width, y + height), "#050608", 18, "#393D44", 3)
    rounded(draw, (x + 10, y + 10, x + width - 10, y + height - 10), "#151A20", 10)
    rounded(draw, (x + 26, y + 26, x + width - 26, y + 100), YELLOW, 8)
    text(draw, (x + 50, y + 74), "BEEP TV", 24, BLACK, True)
    text(draw, (x + 28, y + 162), "SEU PIN DE ACESSO", 20, WHITE, True)
    text(draw, (x + 28, y + 224), "642 903", 48, YELLOW, True)
    circle(draw, (x + width / 2, y + height + 16), 3, "#5B5F66")


def draw_phone(draw: ImageDraw.ImageDraw, x: int, y: int, width: int, height: int) -> None:
    rounded(draw, (x, y, x + width, y + height), "#07080B", 34, WHITE, 3)
    rounded(draw, (x + 8, y + 12, x + width - 8, y + height - 24), "#17191F", 25)
    rounded(draw, (x + width / 2 - 30, y + 22, x + width / 2 + 30, y + 30), "#050506", 4)
    text(draw, (x + 34, y + 98), "CONECTAR TV", 12, YELLOW, True)
    text(draw, (x + 34, y + 140), "Digite o PIN", 22, WHITE, True)
    text(draw, (x + 34, y + 168), "exibido na sua tela", 12, MUTED)
    for i in range(6):
        bx = x + 32 + (i % 3) * 67
        by = y + 208 + (i // 3) * 61
        rounded(draw, (bx, by, bx + 54, by + 43), "#262A32", 10, YELLOW if i == 0 else WHITE, 2 if i == 0 else 1)
    text(draw, (x + 59, y + 237), "6", 22, YELLOW, True, "mm")
    rounded(draw, (x + 32, y + 352, x + width - 34, y + 398), YELLOW, 12)
    text(draw, (x + width / 2, y + 382), "PAREAR COM A TV", 12, BLACK, True, "mm")
    text(draw, (x + 34, y + 444), "PIN  •  QR CODE  •  REDE LOCAL", 9, MUTED, True)


def scene_pairing() -> Image.Image:
    image = hex_background()
    header(image, "BEEPAPP  /  TV CONNECT")
    pill(image, (40, 142), 183, "PAREIE SUA TV")
    draw = ImageDraw.Draw(image)
    text(draw, (40, 250), "Uma tela.\nVários jeitos\nde participar.", 46, WHITE, True, "la", 6)
    draw_tv_frame(draw, 42, 518, 470, 286)
    draw_phone(draw, 406, 408, 268, 558)
    text(draw, (40, 930), "Controle canais, volume e favoritos.", 19, WHITE, True)
    text(draw, (40, 964), "Tudo sincronizado em tempo real.", 19, YELLOW_2, True)
    card(image, (40, 1044, 680, 1152), "#15171D", 255, WHITE, 32, 20)
    text(draw, (70, 1082), "D-PAD", 11, MUTED, True)
    circle(draw, (147, 1095), 27, "#282C35", 255, WHITE, 1)
    circle(draw, (206, 1095), 27, "#282C35", 255, WHITE, 1)
    text(draw, (147, 1102), "⌃", 21, YELLOW, True, "mm")
    text(draw, (206, 1102), "⌄", 21, YELLOW, True, "mm")
    text(draw, (280, 1102), "Sua TV, no controle da sua mão.", 15, WHITE, True)
    return image


def scene_live() -> Image.Image:
    image = hex_background()
    header(image, "BEEPAPP  /  AO VIVO")
    pill(image, (40, 142), 205, "INTERAÇÃO EM TEMPO REAL")
    draw = ImageDraw.Draw(image)
    text(draw, (40, 254), "A programação\nresponde.", 52, WHITE, True, "la", 8)
    text(draw, (42, 420), "Reações, chat e enquetes que", 20, WHITE)
    text(draw, (42, 452), "aparecem junto com o conteúdo.", 20, YELLOW_2, True)
    card(image, (40, 550, 340, 902), "#14171D", 255, WHITE, 36, 22)
    text(draw, (66, 590), "CHAT AO VIVO", 12, YELLOW, True)
    circle(draw, (279, 587), 7, GREEN)
    text(draw, (292, 592), "2.4K", 11, GREEN, True)
    rounded(draw, (66, 627, 290, 681), "#20242C", 16)
    text(draw, (84, 649), "Essa pauta merece destaque!", 11, WHITE, True)
    text(draw, (84, 668), "— Marina", 10, MUTED)
    rounded(draw, (66, 700, 260, 754), YELLOW, 16)
    text(draw, (84, 722), "Concordo!", 11, BLACK, True)
    text(draw, (84, 741), "— Você", 10, "#6F5A00")
    rounded(draw, (66, 778, 216, 818), "#20242C", 14)
    text(draw, (84, 804), "Enviar reação", 11, MUTED, True)
    circle(draw, (250, 798), 20, "#242933")
    text(draw, (250, 806), "+", 20, YELLOW, anchor="mm")
    card(image, (366, 550, 680, 902), "#14171D", 255, WHITE, 36, 22)
    text(draw, (392, 590), "ENQUETE DA VEZ", 12, BLUE, True)
    text(draw, (392, 642), "Qual quadro\nvocê quer ver?", 21, WHITE, True, "la", 3)
    text(draw, (392, 704), "Notícias", 12, WHITE, True)
    text(draw, (654, 704), "68%", 12, YELLOW, True, "ra")
    rounded(draw, (392, 719, 654, 728), "#2A2E37", 5)
    rounded(draw, (392, 719, 570, 728), YELLOW, 5)
    text(draw, (392, 765), "Bastidores", 12, WHITE, True)
    text(draw, (654, 765), "32%", 12, MUTED, True, "ra")
    rounded(draw, (392, 780, 654, 789), "#2A2E37", 5)
    rounded(draw, (392, 780, 476, 789), BLUE, 5)
    rounded(draw, (392, 830, 654, 870), "#22262E", 12)
    text(draw, (523, 856), "VOTAR", 11, WHITE, True, "mm")
    text(draw, (40, 1012), "REAÇÕES  •  ENQUETES  •  CHAT", 14, WHITE, True)
    text(draw, (40, 1056), "Faça parte do que está acontecendo.", 20, WHITE, True)
    circle(draw, (610, 1098), 28, YELLOW, 40)
    text(draw, (610, 1107), "+", 30, YELLOW, anchor="mm")
    circle(draw, (658, 1050), 18, YELLOW, 60)
    text(draw, (658, 1057), "♥", 15, YELLOW, True, "mm")
    return image


def scene_points() -> Image.Image:
    image = hex_background()
    draw = ImageDraw.Draw(image)
    header(image, "BEEPAPP  /  GAMIFICAÇÃO")
    pill(image, (40, 142), 173, "CADA INTERAÇÃO VALE")
    text(draw, (40, 254), "Assista.\nParticipe.\nAcumule.", 53, WHITE, True, "la", 8)
    text(draw, (42, 454), "Sua atenção vira pontos, conquistas", 20, WHITE)
    text(draw, (42, 486), "e novas formas de aproveitar a rede.", 20, YELLOW_2, True)
    card(image, (40, 590, 680, 792), "#16181E", 255, WHITE, 38, 24)
    text(draw, (72, 632), "CARTEIRA BEEP", 12, MUTED, True)
    text(draw, (72, 708), "1.280", 58, YELLOW, True)
    text(draw, (72, 750), "pontos disponíveis", 15, WHITE)
    circle(draw, (594, 678), 55, YELLOW, 30, YELLOW, 1)
    text(draw, (594, 690), "★", 48, YELLOW, True, "mm")
    card(image, (40, 842, 340, 1020), "#13151A", 255, WHITE, 33, 20)
    circle(draw, (82, 890), 22, YELLOW, 35, YELLOW, 1)
    text(draw, (82, 898), "✓", 22, YELLOW, True, "mm")
    text(draw, (119, 888), "EXPLORADOR", 12, WHITE, True)
    text(draw, (66, 948), "4 de 5 reconhecimentos", 13, MUTED)
    rounded(draw, (66, 972, 304, 981), "#2B2E36", 5)
    rounded(draw, (66, 972, 256, 981), YELLOW, 5)
    card(image, (366, 842, 680, 1020), "#13151A", 255, WHITE, 33, 20)
    text(draw, (392, 888), "ÚLTIMO GANHO", 12, MUTED, True)
    text(draw, (392, 944), "+20 pts", 30, GREEN, True)
    text(draw, (392, 977), "Programa detectado", 13, WHITE, True)
    text(draw, (40, 1112), "A experiência fica melhor quando você participa.", 18, WHITE, True)
    return image


def scene_ecosystem() -> Image.Image:
    image = photo_base(ASSETS / "station-hero.jpg", 164, "#090A0D")
    overlay = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    add_vertical_gradient(overlay, (9, 10, 13, 110), (9, 10, 13, 244))
    image = Image.alpha_composite(image, overlay)
    header(image, "BEEPAPP  /  ECOSSISTEMA")
    pill(image, (40, 142), 243, "UMA REDE PARA TODOS")
    draw = ImageDraw.Draw(image)
    text(draw, (40, 254), "Um ecossistema\nque conecta\ntodos.", 49, WHITE, True, "la", 7)
    text(draw, (42, 453), "Cada perfil tem um jeito de", 20, WHITE)
    text(draw, (42, 485), "participar e criar valor.", 20, YELLOW_2, True)
    roles = (
        (592, "FÃS", "Descobrem e interagem", YELLOW, "01"),
        (726, "DIRETORES", "Organizam a programação", BLUE, "02"),
        (860, "APRESENTADORES", "Conectam audiência", GREEN, "03"),
        (994, "ANUNCIANTES", "Falam com o público", "#FF9A6B", "04"),
    )
    for y, label, description, color, mark in roles:
        card(image, (40, y, 680, y + 100), "#111318", 245, WHITE, 46, 18)
        circle(draw, (88, y + 50), 25, color, 40, color, 1)
        text(draw, (88, y + 56), mark, 12, color, True, "mm")
        text(draw, (132, y + 43), label, 14, WHITE, True)
        text(draw, (132, y + 70), description, 13, MUTED)
        text(draw, (640, y + 58), "→", 25, color, anchor="ra")
    return image


def scene_end() -> Image.Image:
    image = hex_background()
    draw = ImageDraw.Draw(image)
    circle(draw, (360, 360), 210, YELLOW, 15, YELLOW, 1)
    circle(draw, (360, 360), 150, BLACK, 0, YELLOW, 1)
    paste_logo(image, (279, 240), 162)
    text(draw, (360, 565), "BEEP", 38, YELLOW, True, "ma")
    text(draw, (360, 694), "Conteúdo conectado.", 28, WHITE, True, "ma")
    text(draw, (360, 735), "Interação que vale.", 28, YELLOW_2, True, "ma")
    line(draw, ((210, 812), (510, 812)), YELLOW, 1, 170)
    text(draw, (360, 878), "BEEPAPP MOBILE", 14, WHITE, True, "ma")
    text(draw, (360, 1160), "RÁDIO  •  TV  •  COMUNIDADE", 14, MUTED, True, "ma")
    return image


def find_ffmpeg() -> str:
    configured = os.environ.get("FFMPEG_BIN")
    if configured and Path(configured).exists():
        return configured
    found = shutil.which("ffmpeg")
    if found:
        return found
    raise SystemExit("FFmpeg não encontrado. Instale-o ou defina FFMPEG_BIN=/caminho/para/ffmpeg")


def run(command: list[str]) -> None:
    print("+", " ".join(command))
    subprocess.run(command, check=True)


def save_scenes(directory: Path) -> list[Path]:
    directory.mkdir(parents=True, exist_ok=True)
    images = [scene_intro(), scene_radio(), scene_tv(), scene_pairing(), scene_live(), scene_points(), scene_ecosystem(), scene_end()]
    paths: list[Path] = []
    for index, image in enumerate(images):
        target = directory / f"scene-{index:02d}.png"
        image.convert("RGB").save(target, quality=95)
        paths.append(target)
    return paths


def assemble_video(scene_paths: Sequence[Path], output: Path, narration: Path | None, ffmpeg: str,
                   keep_scenes: bool = False) -> None:
    output.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory(prefix="beepapp-video-") as temp_name:
        temp = Path(temp_name)
        clip_paths: list[Path] = []
        for index, (scene, duration) in enumerate(zip(scene_paths, DURATIONS)):
            clip = temp / f"clip-{index:02d}.mp4"
            fade_start = max(0.0, duration - 0.38)
            video_filter = (
                "zoompan=z='min(zoom+0.00065,1.055)':"
                "x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=1:s=720x1280:fps=30,"
                "noise=alls=1:allf=t,"
                f"fade=t=in:st=0:d=0.34,fade=t=out:st={fade_start:.3f}:d=0.38"
            )
            run([
                ffmpeg, "-hide_banner", "-loglevel", "error", "-y",
                "-loop", "1", "-i", str(scene), "-t", f"{duration:.3f}",
                "-vf", video_filter,
                "-an", "-c:v", "libx264", "-preset", "veryfast", "-crf", "22",
                "-pix_fmt", "yuv420p", str(clip),
            ])
            clip_paths.append(clip)

        concat_list = temp / "concat.txt"
        concat_list.write_text("".join(f"file '{path}'\n" for path in clip_paths), encoding="utf-8")
        silent_video = temp / "silent.mp4"
        run([
            ffmpeg, "-hide_banner", "-loglevel", "error", "-y",
            "-f", "concat", "-safe", "0", "-i", str(concat_list),
            "-c", "copy", str(silent_video),
        ])

        final_temp = temp / "final.mp4"
        if narration and narration.exists():
            audio_filter = f"[1:a]afade=t=in:st=0:d=0.20,afade=t=out:st={VIDEO_DURATION - 0.8:.2f}:d=0.7[a]"
            run([
                ffmpeg, "-hide_banner", "-loglevel", "error", "-y",
                "-i", str(silent_video), "-i", str(narration),
                "-filter_complex", audio_filter,
                "-map", "0:v:0", "-map", "[a]", "-t", f"{VIDEO_DURATION:.3f}",
                "-c:v", "copy", "-c:a", "aac", "-b:a", "160k", "-ar", "48000",
                "-movflags", "+faststart", str(final_temp),
            ])
        else:
            shutil.copy2(silent_video, final_temp)
        output_tmp = output.with_suffix(output.suffix + ".tmp")
        shutil.copy2(final_temp, output_tmp)
        output_tmp.replace(output)

        if keep_scenes:
            saved = output.parent / "video-scenes"
            saved.mkdir(exist_ok=True)
            for scene in scene_paths:
                shutil.copy2(scene, saved / scene.name)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Gera o vídeo promocional vertical do BeepApp")
    parser.add_argument("--output", type=Path, default=MARKETING / "beepapp-promo.mp4", help="Arquivo MP4 de saída")
    parser.add_argument("--narration", type=Path, default=MARKETING / "beepapp-narration.mp3", help="Narração MP3")
    parser.add_argument("--no-audio", action="store_true", help="Renderiza sem a narração")
    parser.add_argument("--keep-scenes", action="store_true", help="Salva os PNGs das cenas ao lado do MP4")
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    ffmpeg = find_ffmpeg()
    with tempfile.TemporaryDirectory(prefix="beepapp-scenes-") as scene_dir_name:
        scene_paths = save_scenes(Path(scene_dir_name))
        narration = None if args.no_audio else args.narration
        assemble_video(scene_paths, args.output, narration, ffmpeg, args.keep_scenes)
    print(f"Vídeo gerado: {args.output}")


if __name__ == "__main__":
    main()
