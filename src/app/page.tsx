export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 px-6 py-24 text-center">
      <p className="rounded-full border-2 border-[#d5dfd8] bg-white px-4 py-1 text-sm font-bold text-[#4b5563]">
        Phase 0: project setup
      </p>
      <h1 className="text-5xl font-extrabold tracking-tight text-[#167a4f]">
        Kalding English
      </h1>
      <p className="max-w-md text-lg text-[#4b5563]">
        Learn English by typing. The app shell is running. The design system comes next.
      </p>
      <p className="font-mono text-base text-[#1f2937]">
        type<span className="animate-pulse">|</span>
      </p>
    </main>
  );
}
