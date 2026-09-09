/* Footer language switcher: outside-click + Esc close, remember the explicit choice,
   and pin the browser's own language above the list so a mis-click is one click to undo.
   Markup is <details>/<summary>; links work fine without this file. */
(function () {
    'use strict';

    /* Cloudflare Web Analytics beacon (cookieless, no consent banner needed).
       ponytail: lives here because this is the one script all 244 pages load —
       the 180 locale subpages aren't regenerated from a template. */
    var cf = document.createElement('script');
    cf.type = 'module';
    cf.src = 'https://static.cloudflareinsights.com/beacon.min.js';
    cf.setAttribute('data-cf-beacon', '{"token":"643a998263e043b1b934be48cb6d38b1"}');
    document.head.appendChild(cf);

    var menu = document.querySelector('.lang-menu');
    if (!menu) return;
    var summary = menu.querySelector('summary');

    document.addEventListener('click', function (e) {
        if (menu.open && !menu.contains(e.target)) menu.open = false;
    });
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && menu.open) {
            menu.open = false;
            summary.focus();
        }
    });
    menu.addEventListener('click', function (e) {
        var a = e.target && e.target.closest ? e.target.closest('a[hreflang]') : null;
        if (!a) return;
        try { localStorage.setItem('icp-lang', a.getAttribute('hreflang')); } catch (err) {}
    });

    /* ---- Pinned browser-language row ---- */

    /* Same mapping as the head redirect IIFE, plus the zh regions it misses.
       ponytail: 9 pairs duplicated rather than shared — a module would cost a request. */
    var ALIASES = {
        'zh': 'zh-Hans', 'zh-cn': 'zh-Hans', 'zh-sg': 'zh-Hans',
        'zh-tw': 'zh-Hant', 'zh-hk': 'zh-Hant', 'zh-mo': 'zh-Hant',
        'pt': 'pt-BR', 'no': 'nb', 'tl': 'fil'
    };

    var panel = menu.querySelector('.lang-panel');
    var list = menu.querySelector('.lang-list');
    if (!panel || !list) return;

    /* the rendered list is the only locale registry we need */
    var byCode = Object.create(null);
    var links = list.querySelectorAll('a[hreflang]');
    for (var i = 0; i < links.length; i++) {
        byCode[links[i].getAttribute('hreflang').toLowerCase()] = links[i];
    }
    function lookup(tag) {
        return byCode[tag] || byCode[(ALIASES[tag] || '').toLowerCase()] || null;
    }

    /* every preferred language we ship, in the browser's own order — iOS Settings >
       Language & Region > Preferred Languages. ponytail: 3 is enough to keep the
       section from crowding out the list; raise it if anyone actually lists more. */
    var MAX_PINNED = 3;
    var wanted = navigator.languages || [navigator.language || ''];
    var hits = [];
    var actionable = 0;
    for (var j = 0; j < wanted.length && hits.length < MAX_PINNED; j++) {
        var tag = String(wanted[j]).toLowerCase();
        var a = lookup(tag) || lookup(tag.split('-')[0]);
        /* keep the page's own language so the block mirrors the browser's list;
           skip only what we don't ship and en-US/en style duplicates */
        if (!a || hits.indexOf(a) !== -1) continue;
        hits.push(a);
        if (!a.hasAttribute('aria-current')) actionable++;
    }
    /* Nothing in their list is shipped — offer one way out rather than nothing.
       ru readers get uk by deliberate choice; everyone else gets English.
       ponytail: last resort only, so a browser that matched something keeps it. */
    if (!hits.length) {
        var fallback = 'en';
        for (var n = 0; n < wanted.length; n++) {
            if (String(wanted[n]).toLowerCase().split('-')[0] === 'ru') { fallback = 'uk'; break; }
        }
        var fb = byCode[fallback];
        if (fb) { hits.push(fb); if (!fb.hasAttribute('aria-current')) actionable++; }
    }
    if (!actionable) return;   /* nothing to switch to -> no block at all */

    /* clone: the anchors already carry the right relative href for this page's depth */
    var pinned = document.createElement('ul');
    pinned.className = 'lang-list lang-pinned';
    pinned.setAttribute('role', 'list');
    pinned.setAttribute('translate', 'no');
    for (var k = 0; k < hits.length; k++) {
        var li = document.createElement('li');
        li.appendChild(hits[k].cloneNode(true));
        pinned.appendChild(li);
    }
    panel.insertBefore(pinned, list);
})();
