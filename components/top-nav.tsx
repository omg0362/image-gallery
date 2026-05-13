const navItems = ["FEATURES", "PRICING", "CONTACT"];

function TopNav() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-white/[0.08] bg-[#030303]/70 backdrop-blur-xl">
      <nav className="mx-auto grid h-16 w-full max-w-6xl grid-cols-[1fr_auto_1fr] items-center px-4">
        <div />
        <div className="flex items-center gap-5 sm:gap-12">
          {navItems.map((item) => (
            <a
              key={item}
              href={`#${item.toLowerCase()}`}
              className="text-[10px] font-medium tracking-[0.16em] text-white/60 transition-colors hover:text-white sm:text-xs sm:tracking-[0.22em]"
            >
              {item}
            </a>
          ))}
        </div>
        <div className="flex justify-end">
          <a
            href="#get-started"
            className="hidden h-9 items-center justify-center rounded-full border border-white/[0.16] bg-white/[0.06] px-4 text-xs font-semibold tracking-wide text-white transition-colors hover:bg-white hover:text-[#030303] sm:inline-flex"
          >
            Get Started
          </a>
        </div>
      </nav>
    </header>
  );
}

export { TopNav };
