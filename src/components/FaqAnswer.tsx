import Link from "@/components/Link";

/**
 * An answer written in the CMS: plain text, blank lines start a new paragraph, and [words](/page) or
 * [words](https://...) becomes a link. Nothing else is interpreted, so an answer can never inject markup.
 */
export default function FaqAnswer({ text }: { text: string }) {
  return (
    <>
      {text.split(/\n{2,}/).map((para, pi) => (
        <p key={pi} className={pi === 0 ? "" : "mt-3"}>
          {para.split(/(\[[^\]]+\]\([^)\s]+\))/g).map((part, i) => {
            const m = /^\[([^\]]+)\]\(([^)\s]+)\)$/.exec(part);
            if (!m) return part.split("\n").flatMap((line, li) => (li === 0 ? [line] : [<br key={`${i}-${li}`} />, line]));
            const href = m[2];
            if (href.startsWith("/")) return <Link key={i} href={href} className="text-maroon underline underline-offset-2">{m[1]}</Link>;
            if (/^https?:\/\//.test(href)) return <a key={i} href={href} target="_blank" rel="noopener noreferrer" className="text-maroon underline underline-offset-2">{m[1]}</a>;
            return m[1];
          })}
        </p>
      ))}
    </>
  );
}
