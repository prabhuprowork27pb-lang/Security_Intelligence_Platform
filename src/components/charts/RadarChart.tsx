import { useEffect, useRef } from "react";

interface DomainScore {
  domain_key: string;
  domain_name: string;
  maturity_1_5: number;
}

interface RadarChartProps {
  domains: DomainScore[];
}

export function RadarChart({ domains }: RadarChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas size
    const size = 400;
    canvas.width = size;
    canvas.height = size;

    const centerX = size / 2;
    const centerY = size / 2;
    const radius = size * 0.35;
    const levels = 5;

    // Clear canvas
    ctx.clearRect(0, 0, size, size);

    // Draw concentric circles for levels
    ctx.strokeStyle = "#E5E7EB";
    ctx.lineWidth = 1;
    for (let i = 1; i <= levels; i++) {
      ctx.beginPath();
      ctx.arc(centerX, centerY, (radius / levels) * i, 0, 2 * Math.PI);
      ctx.stroke();
    }

    // Draw axes and labels
    const numAxes = Math.min(domains.length, 9);
    const angleStep = (2 * Math.PI) / numAxes;

    ctx.strokeStyle = "#E5E7EB";
    ctx.fillStyle = "#6B7280";
    ctx.font = "10px Inter, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    domains.slice(0, numAxes).forEach((domain, index) => {
      const angle = angleStep * index - Math.PI / 2;
      const x = centerX + radius * Math.cos(angle);
      const y = centerY + radius * Math.sin(angle);

      // Draw axis line
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(x, y);
      ctx.stroke();

      // Draw label
      const labelX = centerX + (radius + 30) * Math.cos(angle);
      const labelY = centerY + (radius + 30) * Math.sin(angle);
      
      // Split long names
      const words = domain.domain_name.split(" ");
      if (words.length > 2) {
        ctx.fillText(words.slice(0, 2).join(" "), labelX, labelY - 6);
        ctx.fillText(words.slice(2).join(" "), labelX, labelY + 6);
      } else {
        ctx.fillText(domain.domain_name, labelX, labelY);
      }
    });

    // Draw data polygon
    ctx.fillStyle = "rgba(24, 119, 242, 0.2)"; // secondary color with opacity
    ctx.strokeStyle = "#1877F2"; // secondary color
    ctx.lineWidth = 2;

    ctx.beginPath();
    domains.slice(0, numAxes).forEach((domain, index) => {
      const angle = angleStep * index - Math.PI / 2;
      const value = domain.maturity_1_5 / 5; // Normalize to 0-1
      const x = centerX + radius * value * Math.cos(angle);
      const y = centerY + radius * value * Math.sin(angle);

      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Draw data points
    ctx.fillStyle = "#1877F2";
    domains.slice(0, numAxes).forEach((domain, index) => {
      const angle = angleStep * index - Math.PI / 2;
      const value = domain.maturity_1_5 / 5;
      const x = centerX + radius * value * Math.cos(angle);
      const y = centerY + radius * value * Math.sin(angle);

      ctx.beginPath();
      ctx.arc(x, y, 4, 0, 2 * Math.PI);
      ctx.fill();
    });

    // Draw level labels
    ctx.fillStyle = "#9CA3AF";
    ctx.font = "9px Roboto Mono, monospace";
    ctx.textAlign = "center";
    for (let i = 1; i <= levels; i++) {
      ctx.fillText(
        i.toString(),
        centerX + 5,
        centerY - (radius / levels) * i
      );
    }
  }, [domains]);

  return (
    <div className="flex justify-center">
      <canvas ref={canvasRef} className="max-w-full h-auto" />
    </div>
  );
}
