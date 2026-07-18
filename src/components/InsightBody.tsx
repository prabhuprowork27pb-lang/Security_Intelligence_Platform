import { BRAND } from "@/lib/brand";

/**
 * Minimal markdown-lite renderer for Intelligence Insights articles.
 * Supports: `## heading`, `### heading`, blank-line paragraphs, `- bullets`,
 * `*italics*`, `**bold**`, simple `|` tables, and `---` separators.
 * Replaces `{{PLATFORM}}` with the master brand wordmark.
 */
export const InsightBody = ({ source }: { source: string }) => {
  const interpolated = source.split("{{PLATFORM}}").join(BRAND.platformTm);
  const blocks = interpolated.split(/\n{2,}/);

  return (
    <div className="prose prose-neutral max-w-none prose-headings:font-heading prose-headings:tracking-tight prose-p:leading-relaxed prose-p:text-foreground/85 prose-li:text-foreground/85">
      {blocks.map((raw, i) => {
        const block = raw.trim();
        if (!block) return null;

        if (block === "---") {
          return <hr key={i} className="my-8 border-border/50" />;
        }
        if (block.startsWith("### ")) {
          return (
            <h3
              key={i}
              className="font-heading text-lg md:text-xl font-semibold mt-8 mb-3"
            >
              {inline(block.slice(4))}
            </h3>
          );
        }
        if (block.startsWith("## ")) {
          return (
            <h2
              key={i}
              className="font-heading text-xl md:text-2xl font-semibold mt-10 mb-3"
            >
              {inline(block.slice(3))}
            </h2>
          );
        }
        // Table
        if (block.includes("\n|") && block.startsWith("|")) {
          const rows = block.split("\n").filter((r) => r.trim().startsWith("|"));
          const cells = rows.map((r) =>
            r.split("|").slice(1, -1).map((c) => c.trim()),
          );
          const [header, , ...body] = cells;
          return (
            <div key={i} className="my-6 overflow-x-auto">
              <table className="w-full text-sm border border-border/50 rounded-lg overflow-hidden">
                <thead className="bg-muted/40">
                  <tr>
                    {header.map((h, j) => (
                      <th
                        key={j}
                        className="px-3 py-2 text-left font-semibold text-foreground"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {body.map((row, r) => (
                    <tr key={r} className="border-t border-border/40">
                      {row.map((c, j) => (
                        <td
                          key={j}
                          className="px-3 py-2 align-top text-foreground/85"
                        >
                          {c}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        }
        // Numbered list
        if (/^\d+\.\s/.test(block)) {
          const items = block.split(/\n(?=\d+\.\s)/);
          return (
            <ol
              key={i}
              className="list-decimal pl-5 my-4 space-y-2 text-foreground/85"
            >
              {items.map((it, j) => (
                <li key={j} className="leading-relaxed">
                  {inline(it.replace(/^\d+\.\s/, ""))}
                </li>
              ))}
            </ol>
          );
        }
        // Bulleted list
        if (block.startsWith("- ")) {
          const items = block.split(/\n(?=- )/);
          return (
            <ul
              key={i}
              className="list-disc pl-5 my-4 space-y-2 text-foreground/85"
            >
              {items.map((it, j) => (
                <li key={j} className="leading-relaxed">
                  {inline(it.replace(/^- /, ""))}
                </li>
              ))}
            </ul>
          );
        }
        return (
          <p key={i} className="my-4 leading-relaxed text-foreground/85">
            {inline(block)}
          </p>
        );
      })}
    </div>
  );
};

function inline(text: string): React.ReactNode {
  // Bold then italics; very small surface.
  const parts: React.ReactNode[] = [];
  const regex = /(\*\*[^*]+\*\*|\*[^*]+\*)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let key = 0;
  while ((m = regex.exec(text))) {
    if (m.index > last) parts.push(text.slice(last, m.index));
    const tok = m[0];
    if (tok.startsWith("**")) {
      parts.push(
        <strong key={key++} className="font-semibold text-foreground">
          {tok.slice(2, -2)}
        </strong>,
      );
    } else {
      parts.push(
        <em key={key++} className="italic text-foreground/75">
          {tok.slice(1, -1)}
        </em>,
      );
    }
    last = m.index + tok.length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts;
}

export default InsightBody;
