/** A row of five stars, filled up to `n`. */
export default function Stars({ n, size = 15 }: { n: number; size?: number }) {
  return (
    <div className="flex gap-0.5" aria-label={`${n} out of 5 stars`} role="img">
      {[1, 2, 3, 4, 5].map((i) => (
        <svg
          key={i}
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill={i <= Math.round(n) ? "#a3843f" : "none"}
          stroke="#a3843f"
          strokeWidth="1.5"
          aria-hidden="true"
        >
          <path d="M12 17.3l-6.2 3.7 1.6-7L2 9.2l7.1-.6L12 2l2.9 6.6 7.1.6-5.4 4.8 1.6 7z" />
        </svg>
      ))}
    </div>
  );
}
