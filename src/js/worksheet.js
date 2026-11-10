// Printable worksheet for one simulation (#/sheet/<id>): its story as numbered sections with a picture of
// each chapter, the quick checks as questions to answer on paper, key ideas, space for notes, and an
// answer key on its own page. Built entirely from the simulation's definition.

import { Runner } from './core/engine.js';
import { CATEGORY, ICONS } from './categories.js';
import { chapterBaseline } from './share.js';

const LETTERS = 'ABCDEFGH';
const OPTIONS = [
  { key: 'pictures', label: 'Pictures', on: true },
  { key: 'notes', label: 'Space for notes', on: true },
  { key: 'answers', label: 'Answer key', on: true },
];

/** A still of chapter `i` as a JPEG data URL, rendered the way the player would show it. */
export function renderChapter(def, i, width = 960, height = 600) {
  const host = document.createElement('div');
  host.style.cssText = `position:fixed;left:-9999px;top:0;width:${width}px;height:${height}px;pointer-events:none`;
  document.body.appendChild(host);
  let r;
  try {
    r = new Runner(host, def, { width, height, interactive: false, thumbnail: true, maxDpr: 1, preserve: true });
    const ch = def.story[i];
    // a quick check shows its setup scene, before the answer plays out
    const asking = !!ch.check;
    r.applyParams(chapterBaseline(def, i, asking), 0);
    if (!asking) ch.enter?.(r.sim, r);
    // run the physics (and any slider tweens) without drawing, then draw one frame
    const draw = r.render;
    r.render = () => {};
    const frames = r.tweens.size ? 240 : 150; // a little longer when sliders are still gliding
    for (let f = 0; f < frames; f++) r.step(1 / 60);
    r.render = draw;
    r.step(1 / 60);
    return r.canvas.toDataURL('image/jpeg', 0.86);
  } catch (err) {
    console.warn('worksheet picture failed for', def.id, i, err);
    return null;
  } finally {
    r?.destroy();
    host.remove();
  }
}

export class Worksheet {
  constructor(root, def, { onBack, url, ages }) {
    const cat = CATEGORY[def.category];
    const story = def.story || [];
    let q = 0;
    const questions = [];
    const chapters = story
      .map((ch, i) => {
        let check = '';
        if (ch.check) {
          q++;
          questions.push({ n: q, ch, i });
          check = `
            <div class="sh-q">
              <p><b>Q${q}. Predict.</b> ${ch.check.q}</p>
              <ul>${ch.check.options.map((o, k) => `<li><span class="box">${LETTERS[k]}</span>${o}</li>`).join('')}</ul>
              <p class="sh-label">Explain your thinking:</p>
              <div class="sh-lines"></div>
            </div>`;
        }
        return `
          <li class="sh-ch${ch.check ? ' has-q' : ''}">
            <figure class="sh-pic" data-ch="${i}"><span>Chapter ${i + 1}</span></figure>
            <div class="sh-txt">
              <h2><small>${i + 1}</small>${ch.title}</h2>
              <p>${ch.text || ''}</p>
              ${ch.formula ? `<p class="sh-formula">${ch.formula}</p>` : ''}
              ${check}
            </div>
          </li>`;
      })
      .join('');

    const el = (this.el = document.createElement('div'));
    el.className = 'sheet-page';
    el.style.setProperty('--accent', cat.color);
    el.innerHTML = `
      <div class="sheet-bar">
        <button class="icon-btn" data-act="back" title="Back to the simulation (Esc)">${ICONS.back}</button>
        <div class="sb-title"><b>Worksheet</b><span>${def.title}</span></div>
        <div class="sb-opts">
          ${OPTIONS.map((o) => `<label><input type="checkbox" data-opt="${o.key}"${o.on ? ' checked' : ''}> ${o.label}</label>`).join('')}
        </div>
        <button class="btn primary" data-act="print" disabled>Preparing pictures…</button>
      </div>
      <article class="sheet">
        <header class="sh-head">
          <p class="sh-kicker">ScienceAnim · ${cat.name}${ages ? ` · ${ages}` : ''}</p>
          <h1>${def.title}</h1>
          ${def.tagline ? `<p class="sh-tagline">${def.tagline}</p>` : ''}
          <div class="sh-name"><span>Name</span><span>Class</span><span>Date</span></div>
        </header>
        <section class="sh-intro">
          <p>${def.blurb || ''}</p>
          <p class="sh-link">Explore it yourself: <b>${url}</b></p>
          ${questions.length ? `<p class="sh-how">Read each section, then answer the <b>Predict</b> questions <em>before</em> you watch that part of the simulation.</p>` : ''}
        </section>
        <ol class="sh-chapters">${chapters}</ol>
        ${def.ideas?.length ? `<section class="sh-ideas"><h2>Key ideas</h2><ul>${def.ideas.map((i) => `<li>${i}</li>`).join('')}</ul></section>` : ''}
        <section class="sh-notes" data-part="notes"><h2>Notes and questions</h2><div class="sh-lines tall"></div></section>
        ${
          questions.length
            ? `<section class="sh-key" data-part="answers">
          <h2>Answer key <small>${def.title}</small></h2>
          <ol>${questions
            .map(
              ({ n, ch }) =>
                `<li><b>Q${n}. ${LETTERS[ch.check.answer]}: ${ch.check.options[ch.check.answer]}</b><span>${ch.check.explain || ''}</span></li>`,
            )
            .join('')}</ol>
        </section>`
            : ''
        }
      </article>`;
    root.appendChild(el);
    document.body.classList.add('in-sheet');
    window.scrollTo(0, 0);

    const $ = (s) => el.querySelector(s);
    $('[data-act=back]').addEventListener('click', onBack);
    $('[data-act=print]').addEventListener('click', () => window.print());
    el.querySelectorAll('[data-opt]').forEach((box) => {
      const apply = () => el.classList.toggle('no-' + box.dataset.opt, !box.checked);
      box.addEventListener('change', apply);
      apply();
    });
    this.onKey = (e) => {
      if (e.key === 'Escape') onBack();
    };
    addEventListener('keydown', this.onKey);
    this.renderPictures(def);
  }

  /** Draw each chapter's picture in turn, yielding between them so the page stays responsive. */
  async renderPictures(def) {
    const figs = [...this.el.querySelectorAll('.sh-pic')];
    const btn = this.el.querySelector('[data-act=print]');
    for (const [n, fig] of figs.entries()) {
      btn.textContent = `Preparing pictures ${n + 1}/${figs.length}…`;
      await new Promise((r) => setTimeout(r, 0));
      if (this.destroyed) return;
      const url = renderChapter(def, +fig.dataset.ch);
      if (url) {
        const img = new Image();
        img.alt = `Chapter ${+fig.dataset.ch + 1}: ${def.story[fig.dataset.ch].title}`;
        img.src = url;
        fig.replaceChildren(img);
      } else fig.classList.add('none');
    }
    btn.disabled = false;
    btn.textContent = 'Print';
    this.el.classList.add('ready');
  }

  destroy() {
    this.destroyed = true;
    removeEventListener('keydown', this.onKey);
    document.body.classList.remove('in-sheet');
    this.el.remove();
  }
}
