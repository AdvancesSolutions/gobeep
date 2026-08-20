# Vídeo promocional do BeepApp

Material de apresentação criado a partir das funcionalidades descritas no projeto BeepApp Mobile.

## Arquivos

- `beepapp-promo.mp4` — vídeo vertical 9:16, 720 × 1280, 47 segundos, com narração em português do Brasil.
- `generate_video.py` — script Python que recria as cenas e monta o MP4 com Pillow e FFmpeg.
- `beepapp-narration.mp3` — faixa de voz usada no vídeo, mantida separadamente para reutilização em outros cortes.

## Gerar novamente

```bash
pip install Pillow
python marketing/generate_video.py
```

O script procura o `ffmpeg` no `PATH`. Para indicar um binário específico, use `FFMPEG_BIN=/caminho/para/ffmpeg`. Para gerar uma versão sem voz, use `python marketing/generate_video.py --no-audio`.

## Mensagem

O vídeo apresenta o BeepApp como o companheiro móvel do ecossistema BEEP: reconhecimento de conteúdo de rádio e TV, pareamento com Smart TVs por PIN ou QR Code, controle remoto, chat ao vivo, enquetes, reações e gamificação por pontos. Também destaca os painéis para fãs, diretores, apresentadores e anunciantes.

A versão atual inclui mockups recriados a partir das telas fornecidas: início, perfil, Feed Social, Carteira e Controle Remoto. Os mockups são desenhados pelo próprio `generate_video.py`, para que o vídeo continue reproduzível sem depender dos anexos da conversa.
