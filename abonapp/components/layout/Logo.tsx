import Link from "next/link";
import Image from "next/image";
export default function Logo({ href = "/" }: { href?: string }) {
  return (
    <Link href={href} className="flex items-center">
      <Image src="/logo.png" alt="AbonApp" width={160} height={48} priority className="h-10 w-auto" />
    </Link>
  );
}