const COLORS = [
  ["#FF6B6B", "#EE5A24"], ["#A29BFE", "#6C5CE7"], ["#55E6C1", "#1ABC9C"],
  ["#FECA57", "#FF9F43"], ["#54A0FF", "#2E86DE"], ["#FF9FF3", "#F368E0"],
  ["#00D2D3", "#01A3A4"], ["#FF6348", "#EB4D4B"],
];

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "U";
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash);
}

export function generateAvatar(name: string, size = 256): string {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;

  const colorPair = COLORS[hashCode(name) % COLORS.length];
  const gradient = ctx.createLinearGradient(0, 0, size, size);
  gradient.addColorStop(0, colorPair[0]);
  gradient.addColorStop(1, colorPair[1]);

  // Rounded rect background
  const r = size * 0.22;
  ctx.beginPath();
  ctx.moveTo(r, 0);
  ctx.lineTo(size - r, 0);
  ctx.quadraticCurveTo(size, 0, size, r);
  ctx.lineTo(size, size - r);
  ctx.quadraticCurveTo(size, size, size - r, size);
  ctx.lineTo(r, size);
  ctx.quadraticCurveTo(0, size, 0, size - r);
  ctx.lineTo(0, r);
  ctx.quadraticCurveTo(0, 0, r, 0);
  ctx.closePath();
  ctx.fillStyle = gradient;
  ctx.fill();

  // Initials
  const initials = getInitials(name);
  ctx.fillStyle = "#FFFFFF";
  ctx.font = `bold ${size * 0.4}px -apple-system, BlinkMacSystemFont, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(initials, size / 2, size / 2 + size * 0.02);

  return canvas.toDataURL("image/png");
}
