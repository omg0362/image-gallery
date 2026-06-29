export default function Page() {
  return (
    <main className="min-h-screen px-6 py-10">
      <section className="mx-auto flex max-w-3xl flex-col gap-6">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#6f3d1f]">
          Standalone Project
        </p>
        <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
          New Vercel app, separate deployment link.
        </h1>
        <p className="text-lg leading-8 text-[#52606d]">
          Build this project inside its own folder and set that folder as the
          Vercel Root Directory. It will not replace the root blog or any other
          app in this repository.
        </p>
      </section>
    </main>
  );
}
