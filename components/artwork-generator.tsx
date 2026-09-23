"use client";
/* eslint-disable @next/next/no-img-element */

import { useEffect, useMemo, useRef, useState } from "react";
import { AlertCircle, Download, ImageIcon, LoaderCircle } from "lucide-react";
import { listExecutives, listRankings } from "@/lib/firestore-service";
import { getInitials } from "@/lib/format";
import type { Executive, Ranking, RankingEntry } from "@/lib/types";

type ArtFormat = "feed" | "story";

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = src;
  });
}

function drawCirclePhoto(context: CanvasRenderingContext2D, image: HTMLImageElement | null, x: number, y: number, radius: number, name: string) {
  context.save();
  context.beginPath();
  context.arc(x, y, radius, 0, Math.PI * 2);
  context.clip();
  if (image) {
    const scale = Math.max((radius * 2) / image.naturalWidth, (radius * 2) / image.naturalHeight);
    const width = image.naturalWidth * scale;
    const height = image.naturalHeight * scale;
    context.drawImage(image, x - width / 2, y - height / 2, width, height);
  } else {
    context.fillStyle = "#20242b";
    context.fillRect(x - radius, y - radius, radius * 2, radius * 2);
    context.fillStyle = "#ffc400";
    context.font = `900 ${Math.round(radius * .65)}px Arial`;
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillText(getInitials(name), x, y + 4);
  }
  context.restore();
  context.strokeStyle = "#ffc400";
  context.lineWidth = Math.max(8, radius * .07);
  context.beginPath();
  context.arc(x, y, radius, 0, Math.PI * 2);
  context.stroke();
}

function fitText(context: CanvasRenderingContext2D, text: string, maxWidth: number, startSize: number, minSize = 24) {
  let size = startSize;
  while (size > minSize) {
    context.font = `900 ${size}px Arial`;
    if (context.measureText(text).width <= maxWidth) break;
    size -= 2;
  }
  return size;
}

async function drawArtwork(canvas: HTMLCanvasElement, ranking: Ranking, executives: Executive[], format: ArtFormat) {
  const width = 1080;
  const height = format === "story" ? 1920 : 1350;
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) return;
  await document.fonts.ready;

  const gradient = context.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, "#050608");
  gradient.addColorStop(.55, "#111318");
  gradient.addColorStop(1, "#241c02");
  context.fillStyle = gradient;
  context.fillRect(0, 0, width, height);

  context.strokeStyle = "rgba(255,196,0,.18)";
  context.lineWidth = 2;
  context.beginPath();
  context.arc(width + 40, 150, 390, 0, Math.PI * 2);
  context.stroke();
  context.beginPath();
  context.arc(-90, height - 70, 330, 0, Math.PI * 2);
  context.stroke();

  try {
    const logo = await loadImage("/assets/gpv-icon.png");
    context.drawImage(logo, 70, 62, 76, 76);
  } catch {}
  context.fillStyle = "#ffffff";
  context.textAlign = "left";
  context.font = "900 34px Arial";
  context.fillText("RANKING BR", 168, 98);
  context.fillStyle = "#ffc400";
  context.font = "800 16px Arial";
  context.letterSpacing = "4px";
  context.fillText("GPV ASSOCIADOS", 170, 126);

  context.textAlign = "center";
  context.fillStyle = "#ffc400";
  context.font = "900 20px Arial";
  context.fillText(ranking.label.toUpperCase(), width / 2, format === "story" ? 245 : 205);
  context.fillStyle = "#ffffff";
  context.font = `900 ${format === "story" ? 94 : 80}px Arial`;
  context.fillText("TOP 3", width / 2, format === "story" ? 350 : 300);
  context.fillStyle = "#8d929b";
  context.font = "600 22px Arial";
  context.fillText("DESEMPENHO EM VEÍCULOS ATIVOS", width / 2, format === "story" ? 402 : 350);

  const top = ranking.entries.slice(0, 3);
  const executiveById = new Map(executives.map((executive) => [executive.id, executive]));
  const compact = format === "feed";
  const positions = compact
    ? [{ x: 540, y: 540, r: 125 }, { x: 290, y: 800, r: 105 }, { x: 790, y: 800, r: 105 }]
    : [{ x: 540, y: 650, r: 155 }, { x: 290, y: 1120, r: 132 }, { x: 790, y: 1120, r: 132 }];

  await Promise.all(top.map(async (entry, index) => {
    const executive = entry.executiveId ? executiveById.get(entry.executiveId) : undefined;
    let photo: HTMLImageElement | null = null;
    if (executive?.fotoDataUrl) {
      try { photo = await loadImage(executive.fotoDataUrl); } catch {}
    }
    const position = positions[index];
    drawCirclePhoto(context, photo, position.x, position.y, position.r, entry.name);
    context.fillStyle = "#ffc400";
    context.beginPath();
    context.arc(position.x + position.r * .72, position.y - position.r * .72, position.r * .28, 0, Math.PI * 2);
    context.fill();
    context.fillStyle = "#151000";
    context.font = `900 ${Math.round(position.r * .28)}px Arial`;
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillText(`${index + 1}º`, position.x + position.r * .72, position.y - position.r * .7);

    const nameY = position.y + position.r + (compact ? 55 : 68);
    context.fillStyle = "#ffffff";
    const name = entry.name.toUpperCase();
    const fontSize = fitText(context, name, index === 0 ? 610 : 420, compact ? 38 : 44, 25);
    context.font = `900 ${fontSize}px Arial`;
    context.textBaseline = "alphabetic";
    context.fillText(name, position.x, nameY);
    context.fillStyle = "#9da2aa";
    context.font = `700 ${compact ? 18 : 22}px Arial`;
    context.fillText(entry.team.toUpperCase(), position.x, nameY + (compact ? 34 : 42));
    context.fillStyle = "#ffc400";
    context.font = `900 ${compact ? 31 : 38}px Arial`;
    context.fillText(`${entry.plates} VEÍCULOS`, position.x, nameY + (compact ? 77 : 92));
  }));

  const footerY = height - 110;
  context.strokeStyle = "rgba(255,255,255,.14)";
  context.beginPath(); context.moveTo(70, footerY - 36); context.lineTo(width - 70, footerY - 36); context.stroke();
  context.textAlign = "left";
  context.fillStyle = "#777d87";
  context.font = "700 17px Arial";
  context.fillText("RESULTADO OFICIAL DO FECHAMENTO", 70, footerY);
  context.textAlign = "right";
  context.fillStyle = "#ffc400";
  context.fillText("RANKING BR · GPV ASSOCIADOS", width - 70, footerY);
}

export function ArtworkGenerator() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [rankings, setRankings] = useState<Ranking[]>([]);
  const [executives, setExecutives] = useState<Executive[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [format, setFormat] = useState<ArtFormat>("feed");
  const [loading, setLoading] = useState(true);
  const [drawing, setDrawing] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([listRankings(), listExecutives()])
      .then(([rankingItems, executiveItems]) => { setRankings(rankingItems); setExecutives(executiveItems); setSelectedId(rankingItems[0]?.id ?? ""); })
      .catch((caught) => setError(caught instanceof Error ? caught.message : "Não foi possível carregar os dados da arte."))
      .finally(() => setLoading(false));
  }, []);
  const ranking = useMemo(() => rankings.find((item) => item.id === selectedId) ?? rankings[0], [rankings, selectedId]);

  useEffect(() => {
    if (!ranking || !canvasRef.current) return;
    setDrawing(true);
    drawArtwork(canvasRef.current, ranking, executives, format).finally(() => setDrawing(false));
  }, [ranking, executives, format]);

  function download() {
    if (!canvasRef.current || !ranking) return;
    const anchor = document.createElement("a");
    anchor.download = `ranking-br-${ranking.periodEnd}-${format}.png`;
    anchor.href = canvasRef.current.toDataURL("image/png");
    anchor.click();
  }

  if (loading) return <div className="panel loading-panel"><LoaderCircle className="spin" /> Preparando gerador...</div>;
  if (error) return <div className="notice notice--error"><AlertCircle size={19} /><span>{error}</span></div>;
  if (!ranking) return <section className="panel empty-state"><ImageIcon size={36} /><h3>Nenhum ranking disponível</h3><p>Confirme um fechamento antes de gerar a arte do Top 3.</p></section>;

  return <div className="artwork-layout">
    <aside className="panel artwork-controls"><span className="section-kicker">Gerador de imagem</span><h2>Arte do Top 3</h2><p>A composição usa as fotos cadastradas nos executivos e os dados congelados no fechamento.</p>
      <label className="form-label"><span>Fechamento</span><select className="text-input" value={ranking.id} onChange={(event) => setSelectedId(event.target.value)}>{rankings.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select></label>
      <label className="form-label"><span>Formato</span><select className="text-input" value={format} onChange={(event) => setFormat(event.target.value as ArtFormat)}><option value="feed">Feed 4:5 · 1080 × 1350</option><option value="story">Story 9:16 · 1080 × 1920</option></select></label>
      <div className="artwork-top-list">{ranking.entries.slice(0, 3).map((entry: RankingEntry) => { const executive = executives.find((item) => item.id === entry.executiveId); return <div key={entry.normalizedName}>{executive?.fotoDataUrl ? <img src={executive.fotoDataUrl} alt="" /> : <span>{getInitials(entry.name)}</span>}<div><strong>{entry.position}º · {entry.name}</strong><small>{executive?.fotoDataUrl ? "Foto cadastrada" : "Sem foto: serão usadas iniciais"}</small></div></div>; })}</div>
      <button className="button button--primary button--full" onClick={download} disabled={drawing}><Download size={18} /> {drawing ? "Montando arte..." : "Baixar PNG"}</button>
    </aside>
    <section className={`artwork-preview artwork-preview--${format}`}><canvas ref={canvasRef} aria-label="Prévia da arte Top 3" /></section>
  </div>;
}
