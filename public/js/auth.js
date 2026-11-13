/* Password Strength Enhancement - colour-coded passwords.
 *
 * Every character of the password can be given a colour. The server receives
 * the password as `char:colour` pairs (e.g. "a:red" "B:none"), so the same
 * letters in different colours make a different, stronger password.
 */
(function () {
	'use strict';

	var USERNAME_RE = /^[A-Za-z0-9@#_+']{6,15}$/;
	var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
	var PW_ALLOWED_RE = /^[A-Za-z\d@$!%*?&]+$/;
	var COLOURS = {
		red: '#ef4444', orange: '#f59e0b', yellow: '#facc15', green: '#22c55e', cyan: '#22d3ee',
		blue: '#3b82f6', purple: '#a855f7', pink: '#ec4899', brown: '#a16207'
	};

	// Colours dark enough to need white characters on top.
	var LIGHT_TEXT = { blue: true, purple: true, brown: true };

	/* ---------- helpers ---------- */

	// Keep the colour array aligned with the text when the user edits the middle of it.
	function spliceColours(colours, oldVal, newVal) {
		var p = 0;
		while (p < oldVal.length && p < newVal.length && oldVal[p] === newVal[p]) p++;
		var s = 0;
		while (s < oldVal.length - p && s < newVal.length - p &&
			oldVal[oldVal.length - 1 - s] === newVal[newVal.length - 1 - s]) s++;
		var added = newVal.length - p - s;
		var fill = [];
		for (var i = 0; i < added; i++) fill.push('');
		var head = colours.slice(0, p);
		var tail = colours.slice(oldVal.length - s);
		return head.concat(fill, tail).slice(0, newVal.length);
	}

	function encode(value, colours) {
		var out = '';
		for (var i = 0; i < value.length; i++) out += value[i] + ':' + (colours[i] || 'none');
		return out;
	}

	function poolSize(pw) {
		var n = 0;
		if (/[a-z]/.test(pw)) n += 26;
		if (/[A-Z]/.test(pw)) n += 26;
		if (/\d/.test(pw)) n += 10;
		if (/[^A-Za-z\d]/.test(pw)) n += 10;
		return n || 1;
	}

	// Rough entropy estimate. Each coloured character adds log2(9) bits because
	// an attacker has to guess which of the nine colours was used.
	function strength(pw, colours) {
		var base = pw.length * Math.log(poolSize(pw)) / Math.LN2;
		var coloured = 0;
		for (var i = 0; i < pw.length; i++) if (colours[i]) coloured++;
		var bonus = coloured * Math.log(9) / Math.LN2;
		return { base: base, bonus: bonus, total: base + bonus };
	}

	function rate(bits, empty) {
		if (empty) return { pct: 0, label: '—', color: 'var(--muted)' };
		if (bits < 28) return { pct: 20, label: 'Weak', color: 'var(--bad)' };
		if (bits < 45) return { pct: 45, label: 'Fair', color: 'var(--warn)' };
		if (bits < 65) return { pct: 72, label: 'Good', color: 'var(--accent-2)' };
		return { pct: 100, label: 'Excellent', color: 'var(--ok)' };
	}

	function setInvalid(field, bad) {
		field.classList.toggle('invalid', bad);
		field.classList.toggle('valid', !bad);
	}

	/* ---------- one form ---------- */

	function initForm(form) {
		var isSignup = form.getAttribute('data-mode') === 'signup';
		var input = form.querySelector('[data-pw]');
		var hidden = form.querySelector('[data-encoded]');
		var chipsEl = form.querySelector('[data-chips]');
		var noteEl = form.querySelector('[data-note]');
		var toggle = form.querySelector('[data-toggle]');
		var defaultNote = noteEl.textContent;

		var colours = [];
		var picked = {};
		var prev = '';
		var revealed = false;
		var sel = { start: 0, end: 0 };

		function note(msg, warn) {
			noteEl.textContent = msg || defaultNote;
			noteEl.classList.toggle('warn', !!warn);
		}

		function pickedIndices() {
			return Object.keys(picked).map(Number).sort(function (a, b) { return a - b; });
		}

		function renderChips() {
			chipsEl.textContent = '';
			var v = input.value;
			if (!v) {
				var e = document.createElement('span');
				e.className = 'chips-empty';
				e.textContent = 'Type a password to start colouring it.';
				chipsEl.appendChild(e);
				return;
			}
			for (var i = 0; i < v.length; i++) {
				var b = document.createElement('button');
				b.type = 'button';
				b.className = 'chip' + (colours[i] ? '' : ' plain') + (picked[i] ? ' picked' : '');
				b.textContent = revealed ? v[i] : '•';
				b.setAttribute('data-i', i);
				b.setAttribute('aria-pressed', picked[i] ? 'true' : 'false');
				b.setAttribute('aria-label', 'Character ' + (i + 1) + (colours[i] ? ', ' + colours[i] : ', no colour'));
				if (colours[i]) {
					b.style.background = COLOURS[colours[i]];
					b.style.color = LIGHT_TEXT[colours[i]] ? '#ffffff' : '#10161c';
					b.style.borderColor = 'transparent';
				}
				chipsEl.appendChild(b);
			}
		}

		function renderStrength() {
			if (!isSignup) return;
			var v = input.value;
			var s = strength(v, colours);
			var r = rate(s.total, !v);
			var fill = form.querySelector('[data-meter-fill]');
			fill.style.width = r.pct + '%';
			fill.style.background = r.color;
			var label = form.querySelector('[data-meter-label]');
			label.textContent = r.label;
			label.style.color = r.color;
			form.querySelector('[data-meter-bonus]').textContent =
				s.bonus > 0 ? '+' + Math.round(s.bonus) + ' bits from colour' : '';
			var rules = {
				len: v.length >= 6,
				lower: /[a-z]/.test(v),
				upper: /[A-Z]/.test(v),
				digit: /\d/.test(v),
				special: /[@$!%*?&]/.test(v)
			};
			Object.keys(rules).forEach(function (k) {
				var li = form.querySelector('[data-rule="' + k + '"]');
				if (li) li.classList.toggle('ok', rules[k]);
			});
		}

		function render() {
			renderChips();
			renderStrength();
		}

		function rememberSelection() {
			sel.start = input.selectionStart || 0;
			sel.end = input.selectionEnd || 0;
		}

		['select', 'keyup', 'mouseup', 'blur', 'touchend'].forEach(function (ev) {
			input.addEventListener(ev, rememberSelection);
		});

		input.addEventListener('input', function () {
			colours = spliceColours(colours, prev, input.value);
			prev = input.value;
			picked = {};
			render();
		});

		chipsEl.addEventListener('click', function (e) {
			var t = e.target.closest('.chip');
			if (!t) return;
			var i = Number(t.getAttribute('data-i'));
			if (picked[i]) delete picked[i]; else picked[i] = true;
			note();
			renderChips();
		});

		toggle.addEventListener('click', function () {
			revealed = !revealed;
			input.type = revealed ? 'text' : 'password';
			toggle.textContent = revealed ? 'Hide' : 'Show';
			renderChips();
		});

		form.querySelector('.palette').addEventListener('click', function (e) {
			var sw = e.target.closest('.swatch');
			if (!sw) return;
			var colour = sw.getAttribute('data-color');
			var idx = pickedIndices();
			if (!idx.length) {
				for (var i = sel.start; i < sel.end; i++) idx.push(i);
			}
			if (!idx.length) {
				note('Select some characters first: tap them above or highlight them in the box.', true);
				return;
			}
			idx.forEach(function (i) {
				if (i < input.value.length) colours[i] = colour;
			});
			picked = {};
			sel = { start: 0, end: 0 };
			note();
			render();
		});

		form.querySelector('[data-clear]').addEventListener('click', function () {
			colours = [];
			picked = {};
			note();
			render();
		});

		function validate() {
			var ok = true;
			if (!isSignup) return ok;
			var u = form.querySelector('[data-field="username"]');
			var m = form.querySelector('[data-field="email"]');
			var p = form.querySelector('[data-field="password"]');
			var uBad = !USERNAME_RE.test(u.querySelector('input').value);
			var mBad = !EMAIL_RE.test(m.querySelector('input').value);
			var v = input.value;
			var pBad = !(v.length >= 6 && /[a-z]/.test(v) && /[A-Z]/.test(v) && /\d/.test(v) &&
				/[@$!%*?&]/.test(v) && PW_ALLOWED_RE.test(v));
			setInvalid(u, uBad); setInvalid(m, mBad); setInvalid(p, pBad);
			return !(uBad || mBad || pBad);
		}

		if (isSignup) {
			['username', 'email'].forEach(function (name) {
				var f = form.querySelector('[data-field="' + name + '"]');
				f.querySelector('input').addEventListener('blur', function () { validate(); });
			});
		}

		form.addEventListener('submit', function (e) {
			if (!validate()) {
				e.preventDefault();
				return;
			}
			hidden.value = encode(input.value, colours);
		});

		render();
	}

	/* ---------- tabs ---------- */

	function initTabs() {
		var tabs = document.querySelectorAll('.tab');
		var panels = document.querySelectorAll('.panel');
		function show(name) {
			tabs.forEach(function (t) { t.setAttribute('aria-selected', String(t.getAttribute('data-tab') === name)); });
			panels.forEach(function (p) { p.hidden = p.getAttribute('data-panel') !== name; });
		}
		tabs.forEach(function (t) {
			t.addEventListener('click', function () { show(t.getAttribute('data-tab')); });
		});
		var root = document.querySelector('[data-initial]');
		show((root && root.getAttribute('data-initial')) || 'signup');
	}

	document.addEventListener('DOMContentLoaded', function () {
		initTabs();
		document.querySelectorAll('.auth-form').forEach(initForm);
	});
})();
