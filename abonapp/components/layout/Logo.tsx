import Link from "next/link";
export default function Logo({ href = "/" }: { href?: string }) {
  return (
    <Link href={href} className="flex items-center gap-2 font-semibold text-brand">
      <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand text-white">A</span>
      <span className="text-lg">AbonApp</span>
    </Link>
  );
}
