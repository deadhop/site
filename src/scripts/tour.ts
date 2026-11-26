// The tour browser (components/Tour.astro). The HTML shows every screen and
// note on its own; this turns it into tabs, a strip of screens and clickable
// points. Positions are set from script because the CSP forbids inline styles.

function setup(root: HTMLElement) {
  const tabs = [...root.querySelectorAll<HTMLButtonElement>('.tour__apps [role="tab"]')];
  const apps = [...root.querySelectorAll<HTMLElement>('.tour__app')];

  root.querySelector<HTMLElement>('.tour__apps')!.hidden = false;
  root.querySelectorAll<HTMLElement>('.tour__strip, .tour__nav, .tour__pin').forEach((el) => (el.hidden = false));
  root.querySelectorAll<HTMLElement>('.tour__pin').forEach((pin) => {
    pin.style.left = `${pin.dataset.x}%`;
    pin.style.top = `${pin.dataset.y}%`;
  });
  root.classList.add('is-ready');

  const viewsOf = (app: HTMLElement) => [...app.querySelectorAll<HTMLElement>('.tour__view')];

  function point(view: HTMLElement, i: number) {
    const pins = [...view.querySelectorAll<HTMLButtonElement>('.tour__pin')];
    const items = [...view.querySelectorAll<HTMLButtonElement>('.tour__point')];
    pins.forEach((p, j) => p.setAttribute('aria-pressed', String(j === i)));
    items.forEach((p, j) => {
      p.setAttribute('aria-pressed', String(j === i));
      p.closest('li')!.classList.toggle('is-on', j === i);
    });
    const callout = view.querySelector<HTMLElement>('.tour__callout')!;
    const pin = pins[i];
    const item = items[i];
    if (!pin || !item) {
      callout.hidden = true;
      return;
    }
    const x = Number(pin.dataset.x);
    const y = Number(pin.dataset.y);
    callout.querySelector('.tour__callout-title')!.textContent = `${i + 1}. ${item.querySelector('b')!.textContent}`;
    callout.querySelector('.tour__callout-body')!.textContent = item.querySelector('.tour__point-text > span')!.textContent;
    callout.style.left = x > 58 ? '' : `${x + 3}%`;
    callout.style.right = x > 58 ? `${100 - x + 3}%` : '';
    callout.style.top = y < 62 ? `${y}%` : '';
    callout.style.bottom = y < 62 ? '' : `${100 - y}%`;
    callout.hidden = false;
  }

  function show(app: HTMLElement, viewId: string, focusThumb = false) {
    const views = viewsOf(app);
    views.forEach((v) => (v.hidden = v.dataset.view !== viewId));
    const thumbs = [...app.querySelectorAll<HTMLButtonElement>('.tour__thumb')];
    thumbs.forEach((t) => {
      const on = t.dataset.view === viewId;
      if (on) t.setAttribute('aria-current', 'true');
      else t.removeAttribute('aria-current');
      if (on && focusThumb) t.focus();
      // Keep the current screen in the strip's view without scrolling the page.
      const strip = t.parentElement!;
      if (on && (t.offsetLeft < strip.scrollLeft || t.offsetLeft + t.offsetWidth > strip.scrollLeft + strip.clientWidth))
        strip.scrollLeft = t.offsetLeft - strip.clientWidth / 2 + t.offsetWidth / 2;
    });
    const view = views.find((v) => v.dataset.view === viewId);
    if (view) point(view, 0);
  }

  function select(i: number, focus = false) {
    tabs.forEach((t, j) => {
      t.setAttribute('aria-selected', String(j === i));
      t.tabIndex = j === i ? 0 : -1;
    });
    apps.forEach((a, j) => (a.hidden = j !== i));
    if (focus) tabs[i].focus();
    const app = apps[i];
    const current = app.querySelector<HTMLElement>('.tour__thumb[aria-current="true"]')?.dataset.view ?? viewsOf(app)[0].dataset.view!;
    show(app, current);
  }

  tabs.forEach((t, i) => {
    t.addEventListener('click', () => select(i));
    t.addEventListener('keydown', (e) => {
      const n = tabs.length;
      const to = e.key === 'ArrowRight' ? (i + 1) % n : e.key === 'ArrowLeft' ? (i - 1 + n) % n : e.key === 'Home' ? 0 : e.key === 'End' ? n - 1 : -1;
      if (to < 0) return;
      e.preventDefault();
      select(to, true);
    });
  });

  apps.forEach((app) => {
    const ids = viewsOf(app).map((v) => v.dataset.view!);
    const step = (by: number, focusThumb = false) => {
      const cur = app.querySelector<HTMLElement>('.tour__thumb[aria-current="true"]')!.dataset.view!;
      show(app, ids[(ids.indexOf(cur) + by + ids.length) % ids.length], focusThumb);
    };
    app.querySelectorAll<HTMLButtonElement>('.tour__thumb').forEach((t) => {
      t.addEventListener('click', () => show(app, t.dataset.view!));
      t.addEventListener('keydown', (e) => {
        if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
        e.preventDefault();
        step(e.key === 'ArrowRight' ? 1 : -1, true);
      });
    });
    app.querySelectorAll<HTMLButtonElement>('.tour__step').forEach((b) => b.addEventListener('click', () => step(Number(b.dataset.step))));
    viewsOf(app).forEach((view) => {
      view.querySelectorAll<HTMLButtonElement>('.tour__pin, .tour__point').forEach((b) =>
        b.addEventListener('click', () => point(view, Number(b.dataset.i))),
      );
    });
  });

  select(0);
}

document.querySelectorAll<HTMLElement>('[data-tour]').forEach(setup);
