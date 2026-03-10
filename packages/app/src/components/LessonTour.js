import $ from 'jquery';

/**
 * LessonTour.js
 * Lightweight interactive lesson scaffold.
 * Usage: import { startLesson } from './LessonTour'
 * Example: startLesson(steps, { onStep: yourCallbackFunction })
 *
 * Each step: { title: string, description: string, image: string, graphId?: string }
 */

export function startLesson(steps = [], opts = {}) {
  if (!Array.isArray(steps) || steps.length === 0) return;

  const onStep = opts.onStep || function () {};

  const total = steps.length;
  let idx = 0;
  let _lessonFullscreenRequested = false;

  const $overlay = $('<div id="lesson-overlay"></div>');
  const $tooltip = $(
    `<div id="lesson-tooltip">
      <button class="lesson-top-close" aria-label="Close">✕</button>
      <div class="lesson-content">
        <div class="lesson-body">
          <div class="lesson-left">
            <div class="lesson-image-wrapper"><img class="lesson-image" src="" alt=""/></div>
            <div class="lesson-text">
              <h3 class="lesson-title"></h3>
              <h4 class="lesson-subtitle"></h4>
              <div class="lesson-description"></div>
            </div>
          </div>
          <div class="lesson-right">
            <div class="lesson-graph-container">
              <div class="lesson-graph-outer">
                <!-- Graph will be rendered into this inner element -->
                <div class="lesson-graph"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="lesson-controls">
        <button class="lesson-skip-btn">Close</button>
        <div class="lesson-navigation">
          <span class="lesson-step-indicator"></span>
          <button class="lesson-prev-btn" style="display:none;">Previous</button>
          <button class="lesson-next-btn">Next</button>
        </div>
      </div>
    </div>`
  );

  $('body').append($overlay).append($tooltip);

  const $title = $tooltip.find('.lesson-title');
  const $subtitle = $tooltip.find('.lesson-subtitle');
  const $desc = $tooltip.find('.lesson-description');
  const $img = $tooltip.find('.lesson-image');
  const $graph = $tooltip.find('.lesson-graph');
  const $graphOuter = $tooltip.find('.lesson-graph-outer');
  const $left = $tooltip.find('.lesson-left');
  const $right = $tooltip.find('.lesson-right');
  const $textBlock = $tooltip.find('.lesson-text');
  const $graphContainer = $tooltip.find('.lesson-graph-container');
  const $indicator = $tooltip.find('.lesson-step-indicator');
  const $prev = $tooltip.find('.lesson-prev-btn');
  const $next = $tooltip.find('.lesson-next-btn');
  const $skip = $tooltip.find('.lesson-skip-btn');

  function render() {
    const step = steps[idx];
    $title.text(step.title || `Step ${idx + 1}`);
    $subtitle.html(step.subtitle || '');
    $desc.html(step.description || '');
    if (step.image) {
      $img.attr('src', step.image).show();
    } else {
      $img.hide();
    }
    // Special-case layout for initial intro step (index 0):
    // use a two-column layout: left = image, right = text. Hide graph area.
    if (idx === 0) {
      try {
        // keep the graph container in layout but hide its contents so
        // the intro page preserves the same overall size as other steps
        $graphContainer.css({ visibility: 'hidden' });
        // move text into right column if not already there
        if ($textBlock.parent()[0] !== $right[0]) $textBlock.appendTo($right);
        // ensure left column only shows the image
        $left.find('.lesson-image-wrapper').css({ display: 'block' });
        // align text block to bottom of right column
        $right.css({ display: 'flex', 'flex-direction': 'column', 'justify-content': 'flex-end' });
      } catch (e) {}
    } else {
      try {
        $graphContainer.css({ visibility: '' });
        // restore text into left column if not already there
        if ($textBlock.parent()[0] !== $left[0]) $textBlock.appendTo($left);
        $left.find('.lesson-image-wrapper').css({ display: '' });
        $right.attr('style', '');
      } catch (e) {}
    }
    // mark tooltip as intro for CSS overrides when idx===0
    try { $tooltip.toggleClass('lesson-intro', idx === 0); } catch (e) {}
    $indicator.text(`${idx + 1} / ${total}`);
    if (idx === 0) $prev.hide(); else $prev.show();
    if (idx === total - 1) $next.text('Finish'); else $next.text('Next');
    try { onStep(idx, step); } catch (e) { console.error('onStep callback error', e); }

    // If the step includes a graphId, dispatch an event with the lesson graph container
    try {
      if (step && step.graphId) {
        // prefer the explicit outer container if present
        const targetEl = ($graphOuter && $graphOuter.length) ? $graphOuter[0] : $graph[0];
        const ev = new CustomEvent('lesson:showGraphInLesson', { detail: { graphId: step.graphId, stepIndex: idx, container: targetEl } });
        window.dispatchEvent(ev);
      } else {
        // clear any existing lesson graph
        if ($graphOuter && $graphOuter.length) $graphOuter.empty(); else $graph.empty();
        // Reset any title highlighting applied by the graph renderer
        try {
          const $lesson = $tooltip;
          $lesson.find('.lesson-title').css('--lesson-highlight', '');
          $lesson.find('.lesson-title').removeClass('lesson-highlighted');
        } catch (e) {}
      }
    } catch (e) {
      // non-fatal
      console.warn('Could not dispatch lesson:showGraphInLesson', e);
    }
  }
  // Request fullscreen for the overall document (not the lesson container)
  // so the tool goes fullscreen while the lesson modal stays its normal size.
  try {
    if (!_lessonFullscreenRequested && !document.fullscreenElement && !document.webkitFullscreenElement && !document.msFullscreenElement) {
      const el = document.documentElement;
      if (el.requestFullscreen) el.requestFullscreen();
      else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen();
      else if (el.msRequestFullscreen) el.msRequestFullscreen();
      _lessonFullscreenRequested = true;
    }
  } catch (e) {
    console.warn('Fullscreen request failed', e);
  }

  function end() {
    // Destroy any GraphView instances rendered inside the lesson to avoid
    // leaving Chart.js instances with removed canvases and dangling listeners.
    try {
      $tooltip.find('.lesson-graph .outer-graph-container').each(function() {
        try {
          const gv = $(this).data('graphView');
          if (gv && typeof gv.destroy === 'function') {
            try { gv.destroy(); } catch (e) {}
          }
        } catch (e) {
          // ignore
        }
      });
    } catch (e) {}

    $tooltip.remove();
    $overlay.remove();

      // Exit fullscreen only if we requested it.
      try {
        if (_lessonFullscreenRequested) {
          if (document.exitFullscreen) document.exitFullscreen();
          else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
          else if (document.msExitFullscreen) document.msExitFullscreen();
          _lessonFullscreenRequested = false;
        }
      } catch (e) {
        // non-fatal
      }
  }

  $next.on('click', function () {
    if (idx < total - 1) { idx += 1; render(); } else { end(); }
  });

  $prev.on('click', function () { if (idx > 0) { idx -= 1; render(); } });

  $skip.on('click', () => end());

  // top-right close button
  $tooltip.find('.lesson-top-close').on('click', () => end());

  render();

  return { next: () => $next.click(), prev: () => $prev.click(), goTo: (i) => { if (i >= 0 && i < total) { idx = i; render(); } }, end };
}

export default startLesson;
