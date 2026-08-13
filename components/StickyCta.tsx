export function StickyCta() {
  return (
    <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-cream/95 p-3 backdrop-blur md:hidden">
      <a
        href="#zapis"
        data-goal="zapis_click"
        className="flex h-12 items-center justify-center rounded-full bg-terracotta text-sm font-medium text-white"
      >
        Записаться на сессию
      </a>
    </div>
  );
}
