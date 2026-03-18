import startLesson from './LessonTour';

import img0 from '../imgs/lesson/Lesson.png';
import img1 from '../imgs/lesson/1.png';
import img2 from '../imgs/lesson/2.png';
import img3 from '../imgs/lesson/3.png';
import img4 from '../imgs/lesson/4.png';
import img5 from '../imgs/lesson/5.png';
import img6 from '../imgs/lesson/6.png';
import img7 from '../imgs/lesson/7.png';
import img8 from '../imgs/lesson/8.png';


/**
 * startLesson8()
 * Creates an 8-step lesson using user's images and provided text.
 */
export function startLesson8() {
  const LEGEND = `
    <b>Arrows</b>
    <div class="ll-row">
      <span class="ll-arrow">+</span>
      <span><b>Positive link</b><br>A&uarr; &rarr; B&uarr; &nbsp;/&nbsp; A&darr; &rarr; B&darr;</span>
    </div>
    <div class="ll-row">
      <span class="ll-arrow">&minus;</span>
      <span><b>Negative link</b><br>A&uarr; &rarr; B&darr; &nbsp;/&nbsp; A&darr; &rarr; B&uarr;</span>
    </div>
    <div class="ll-row">
      <span class="ll-arrow">//&rarr;</span>
      <span><b>Delayed</b><br>Effect takes time</span>
    </div>
    <br/>
    <b>Loops</b>
    <div class="ll-row">
      <span class="ll-arrow">&#x21BB;&nbsp;R</span>
      <span><b>Reinforcing</b><br>Self-amplifying</span>
    </div>
    <div class="ll-row">
      <span class="ll-arrow">&#x21BA;&nbsp;B</span>
      <span><b>Balancing</b><br>Self-correcting</span>
    </div>
  `;
  const steps = [
    {
      title: 'Introduction',
      subtitle: '<span class="lesson-intro-dots"><span class="dot" style="background:#000000"></span><span class="dot" style="background:#00BFFF"></span><span class="dot" style="background:#996633"></span><span class="dot" style="background:#FFD700"></span><span class="dot" style="background:#228B22"></span><span class="dot" style="background:#ED7014"></span><span class="dot" style="background:#FF6347"></span></span>',
      description: `<p>The global food system is one of the largest drivers of environmental and human sustainability challenges worldwide. In this lesson, we will explore how our everyday food behaviours place pressure on key systems including land, water, fertilizers, biodiversity, climate, and human nutrition.</p>`,
      image: img0,
      graphId: null
    },
    {
      title: 'Food Demand',
      subtitle: 'How it all begins',
      description: `<p>It all begins with the demand for food. To produce the food we eat, agriculture needs land for crops and animals, and water to grow and feed them.</p>`,
      image: img1,
      graphId: 'x1',
      legend: LEGEND
    },
    // Population step removed as requested
    {
      title: 'Water',
      subtitle: 'Growing our food',
      description: `<p>Water is essential for producing food. It helps crops grow and is also used to produce feed for livestock. When water is available, crop yields improve and more food can be produced.</p>`,
      image: img2,
      graphId: 'x2',
      legend: LEGEND
    },
    {
      title: 'Land',
      subtitle: 'Growing our food',
      description: `<p>As the demand for food grows, more land is often needed. Forests and natural ecosystems may be converted into farmland to grow more crops and raise more animals.</p>`,
      image: img3,
      graphId: 'x3',
      legend: LEGEND
    },
    {
      title: 'Fertilizer',
      subtitle: 'Growing our food',
      description: `<p>When expanding farmland becomes difficult, farmers try to grow more on the same land. Fertilizers help crops grow faster and increase how much food that land can produce.</p>`,
      image: img4,
      graphId: 'x4',
      legend: LEGEND
    },
    {
      title: 'Biodiversity',
      subtitle: 'How our choices affect us and nature',
      description: `<p>Producing more food can also affect nature. Expanding farmland and using fertilizers can reduce biodiversity and change ecosystems that farming depends on.</p>`,
      image: img5,
      graphId: 'x5',
      legend: LEGEND
    },
    {
      title: 'Climate',
      subtitle: 'How our choices affect us and nature',
      description: `<p>Food production also releases greenhouse gases—from livestock, fertilizers, and land-use change. These emissions warm the climate, which over time can affect crops and ecosystems.</p>`,
      image: img6,
      graphId: 'x6',
      legend: LEGEND
    },
    {
      title: 'Nutrition',
      subtitle: 'How our choices affect us and nature',
      description: `<p>These changes can feed back into the food system. When food supply cannot keep up, undernourishment increases, shaping how much food people are able to consume.</p>`,
      image: img7,
      graphId: 'x7',
      legend: LEGEND,
      zoomLeave: { x: '69%', y: '22%' }
    },
    {
      title: 'Explore Your Behaviour!',
      subtitle: '<span class="lesson-intro-dots"><span class="dot" style="background:#000000"></span><span class="dot" style="background:#00BFFF"></span><span class="dot" style="background:#996633"></span><span class="dot" style="background:#FFD700"></span><span class="dot" style="background:#228B22"></span><span class="dot" style="background:#ED7014"></span><span class="dot" style="background:#FF6347"></span></span>',
      description: `<p>Food demand goes beyond simple calorie needs—it reflects what we choose to eat, how efficiently food is used, and the practices that shape everyday consumption. Explore the simulator to see how your behaviours influence sustainability outcomes.</p>`,
      image: img8,
      graphId: null,
      introLayout: true,
      zoomEnter: true,
      imageStyle: 'max-width: 100%; max-height: min(50vh, 1700px); width: auto;'
    }
  ];

  // Use lesson's internal rendering only (renders into lesson container)
  const lesson = startLesson(steps);

  return lesson;
}

export default startLesson8;
