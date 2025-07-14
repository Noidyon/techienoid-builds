/* ------------ UPDATED APP.JS (bug fixes) ------------- */
document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('pcForm');
  const submitBtn = document.getElementById('submitBtn');
  const progressBar = document.getElementById('progressBar');
  const successMessage = document.getElementById('successMessage');
  const errorMessage = document.getElementById('errorMessage');
  const newFormBtn = document.getElementById('newForm');
  const tryAgainBtn = document.getElementById('tryAgain');

  /* Guard against missing elements (should not occur) */
  if (!form) return;

  /* --------------------------------------------------
     Helpers
  --------------------------------------------------*/
  const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const requiredSelector = '[data-required]';
  const multiSelector = '[data-required-multi]';

  function toggleLoading(state) {
    if (state) {
      submitBtn.disabled = true;
      submitBtn.classList.add('loading');
    } else {
      submitBtn.disabled = false;
      submitBtn.classList.remove('loading');
    }
  }

  /* --------------------------------------------------
     Progress bar logic
  --------------------------------------------------*/
  function updateProgress() {
    const groups = document.querySelectorAll(`${requiredSelector}, ${multiSelector}`);
    if (!groups.length) return;

    let done = 0;
    groups.forEach(g => {
      if (g.matches(requiredSelector)) {
        if (g.tagName === 'FIELDSET') {
          if (g.querySelector('input:checked')) done++;
        } else {
          const field = g.querySelector('input, textarea');
          if (field && field.value.trim()) done++;
        }
      } else if (g.matches(multiSelector)) {
        if (g.querySelectorAll('input:checked').length) done++;
      }
    });

    const percent = Math.round((done / groups.length) * 100);
    progressBar.style.width = `${percent}%`;
  }

  document.addEventListener('input', updateProgress);
  document.addEventListener('change', updateProgress);
  updateProgress(); // initial call

  /* --------------------------------------------------
     Validation logic
  --------------------------------------------------*/
  function clearErrors() {
    document.querySelectorAll('.error-text').forEach(e => {
      e.textContent = '';
      e.classList.remove('show');
    });
  }

  function showError(group, message) {
    const box = group.querySelector('.error-text');
    if (box) {
      box.textContent = message;
      box.classList.add('show');
    }
  }

  function isGroupValid(group) {
    if (group.matches(requiredSelector)) {
      if (group.tagName === 'FIELDSET') {
        return !!group.querySelector('input:checked');
      }
      const field = group.querySelector('input, textarea');
      if (!field) return true;

      if (field.type === 'email') return EMAIL_REGEX.test(field.value.trim());
      return !!field.value.trim();
    }

    if (group.matches(multiSelector)) {
      return group.querySelectorAll('input:checked').length > 0;
    }
    return true;
  }

  function validateForm() {
    clearErrors();
    let valid = true;

    document.querySelectorAll(`${requiredSelector}, ${multiSelector}`).forEach(group => {
      if (!isGroupValid(group)) {
        valid = false;
        var msg = group.matches(multiSelector)
          ? 'Selecione pelo menos uma opção'
          : (group.tagName === 'FIELDSET' ? 'Escolha uma opção' : 'Campo obrigatório');
        if (group.querySelector('input[type="email"]')) {
          if (!group.querySelector('input[type="email"]').value.trim()) {
            // Campo vazio
          } else {
            msg = 'Email inválido';
          }
        }
        showError(group, msg);
      }
    });
    return valid;
  }

  /* --------------------------------------------------
     Submit handler
  --------------------------------------------------*/
  form.addEventListener('submit', async e => {
    e.preventDefault();

    if (!validateForm()) {
      updateProgress();
      return;
    }

    toggleLoading(true);

    const formData = new FormData(form);
    ['Objetivo principal', 'Periféricos'].forEach(name => {
      const selected = form.querySelectorAll(`input[name="${CSS.escape(name)}"]:checked`);
      if (selected.length) {
        formData.delete(name);
        formData.append(name, Array.from(selected).map(i => i.value).join(', '));
      }
    });

    // Simulate success if using placeholder key, otherwise perform real request
    const isPlaceholderKey = formData.get('access_key') === 'YOUR_ACCESS_KEY_HERE';

    try {
      if (isPlaceholderKey) {
        await new Promise(r => setTimeout(r, 500));
      } else {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 15000);
        const res = await fetch(form.action, {
          method: 'POST',
          body: formData,
          signal: controller.signal
        });
        clearTimeout(timeout);
        const json = await res.json();
        if (!json.success) throw new Error('send-failed');
      }
      showSuccess();
    } catch (err) {
      console.error(err);
      showErrorCard();
    } finally {
      toggleLoading(false);
    }
  });

  /* --------------------------------------------------
     UI feedback functions
  --------------------------------------------------*/
  function showSuccess() {
    form.classList.add('hidden');
    errorMessage.classList.add('hidden');
    successMessage.classList.remove('hidden');
    progressBar.style.width = '100%';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function showErrorCard() {
    form.classList.add('hidden');
    successMessage.classList.add('hidden');
    errorMessage.classList.remove('hidden');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  /* --------------------------------------------------
     Reset & retry
  --------------------------------------------------*/
  if (newFormBtn) newFormBtn.addEventListener('click', () => {
    form.reset();
    clearErrors();
    successMessage.classList.add('hidden');
    progressBar.style.width = '0%';
    form.classList.remove('hidden');
    updateProgress();
  });

  if (tryAgainBtn) tryAgainBtn.addEventListener('click', () => {
    errorMessage.classList.add('hidden');
    form.classList.remove('hidden');
  });

  /* --------------------------------------------------
     Floating label interaction
  --------------------------------------------------*/
  document.querySelectorAll('.field-input').forEach(inp => {
    inp.addEventListener('input', () => {
      // Triggered to keep label floated when value present (for autofill also)
      if (inp.value.trim()) {
        inp.classList.add('not-empty');
      } else {
        inp.classList.remove('not-empty');
      }
    });
    // Fire once on load (for cached/autofill)
    inp.dispatchEvent(new Event('input'));
  });
});
