import Link from "next/link";
import Image from "next/image";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center pt-16 px-8">
      <div className="flex items-start gap-20 max-w-3xl w-full">
        <div className="flex flex-col gap-6 pt-4">
          <Link href="/" className="flex items-center gap-1.5 w-fit">
            <Image src="/logo.svg" alt="Flowform" width={36} height={36} />
            <span className="text-foreground text-2xl font-semibold tracking-tight">
              Flowform
            </span>
          </Link>

          <div>
            <p className="text-foreground text-base mb-1">
              <span className="font-semibold">404.</span> That&apos;s an error.
            </p>
            <p className="text-foreground/70 text-sm">
              The requested URL was not found on this server.
              That&apos;s all we know.
            </p>
          </div>
        </div>

        <Image
          src="/not-found-buddy.svg"
          alt="Lost buddy"
          width={280}
          height={200}
          className="shrink-0"
        />
      </div>
    </div>
  );
}