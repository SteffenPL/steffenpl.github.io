<svelte:head>
  <title>AI Tea Seminar</title>
  <meta name="description" content="A welcoming seminar series exploring AI tools and practices for research." />
  <meta name="theme-color" content="#f7f5ef" />
</svelte:head>

<script lang="ts">
  const formUrl = 'https://docs.google.com/forms/d/e/1FAIpQLSdFchVb44SFtnsh5iUzB9C45-sGn0dEhNB2qIwW_MJuj6gG6g/viewform?usp=dialog';
</script>

<main>
  <header class="topbar">
    <a class="wordmark" href="#top" aria-label="AI Tea Seminar home"><span class="cup" aria-hidden="true">✳</span> AI Tea Seminar</a>
    <nav><a class="top-link" href="#talks">Talks</a><a class="top-link" href="#about">About the series <span aria-hidden="true">↘</span></a></nav>
  </header>

  <section class="hero" id="top">
    <div class="hero-copy">
      <p class="eyebrow"><span class="dot"></span> An open seminar series · Research &amp; AI</p>
      <h1>AI Tea<br /><em>Seminar</em></h1>
      <p class="intro">A place to explore how new AI tools can open new paths in research.</p>
      <a class="button" href={formUrl} target="_blank" rel="noopener noreferrer">Join the mailing list <span aria-hidden="true">↗</span></a>
      <p class="button-note">Get updates about the upcoming seminar series.</p>
    </div>
    <div class="art" aria-hidden="true">
      <div class="orbit orbit-one"></div><div class="orbit orbit-two"></div>
      <div class="sun"></div><div class="tea"><div class="tea-liquid"></div><div class="tea-handle"></div><div class="steam steam-one"></div><div class="steam steam-two"></div></div>
      <span class="spark spark-a">✳</span><span class="spark spark-b">·</span><span class="spark spark-c">✳</span>
      <span class="art-caption">curiosity, steeped</span>
    </div>
  </section>

  <section class="talks" id="talks">
    <div class="section-label"><span>01</span> Talks</div>
    <div class="talk-columns">
      <div class="talk-group upcoming">
        <p class="eyebrow"><span class="dot"></span> Upcoming</p>
        <article class="talk-card"><span class="talk-date">To be announced</span><h2>TBH</h2><p>Talk details coming soon.</p><span class="talk-tag">Speaker · TBA</span></article>
      </div>
      <div class="talk-group past">
        <p class="eyebrow">Past talks</p>
        <div class="empty-past"><span aria-hidden="true">—</span><p>No past talks yet.<br />The series is just getting started.</p></div>
      </div>
    </div>
  </section>

  <section class="about" id="about">
    <div class="section-label"><span>02</span> The idea</div>
    <div class="about-copy">
      <h2>Good questions<br />make room for discovery.</h2>
      <p>This seminar is about exploring new AI tools—from harnesses and agentic loops to other releases relevant to using AI in research.</p>
      <p>Students and experienced researchers are equally welcome. We want to find and share patterns that lead to exciting, curious mathematical and computational findings.</p>
    </div>
  </section>

  <section class="principles">
    <div class="section-label"><span>03</span> Our focus</div>
    <div class="principle-card"><span class="principle-mark">↗</span><h3>Tools in practice</h3><p>How to integrate AI into research workflows and use it effectively.</p></div>
    <div class="principle-card"><span class="principle-mark">⌘</span><h3>Open by default</h3><p>A preference for open-source software and open-weight models.</p></div>
    <div class="principle-card"><span class="principle-mark">◎</span><h3>Curious together</h3><p>Shared exploration across experience levels and disciplines.</p></div>
  </section>

  <section class="boundary">
    <span class="boundary-mark" aria-hidden="true">✳</span>
    <div><p class="eyebrow">A note on scope</p><p>Political debates matter. This seminar has a different purpose: discussing how to integrate and use AI most effectively in research.</p></div>
  </section>

  <footer><a class="wordmark" href="#top"><span class="cup" aria-hidden="true">✳</span> AI Tea Seminar</a><span>Bring a question. Leave with a new one.</span><a class="footer-link" href={formUrl} target="_blank" rel="noopener noreferrer">Sign up for updates ↗</a></footer>
</main>

<style>
  :global(*){box-sizing:border-box} :global(html){scroll-behavior:smooth} :global(body){margin:0;background:#f7f5ef;color:#20211e;font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;-webkit-font-smoothing:antialiased} main{max-width:1440px;margin:auto;padding:0 7.1%}.topbar{height:86px;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid #dfded6}.topbar nav{display:flex;gap:28px}.wordmark{display:inline-flex;align-items:center;gap:10px;color:#24251f;text-decoration:none;font-size:14px;font-weight:650;letter-spacing:-.025em}.cup{display:grid;place-items:center;width:27px;height:27px;border:1px solid #bec9a4;border-radius:50%;color:#71834d;font-size:16px}.top-link,.footer-link{color:#47483f;text-decoration:none;font-size:12px}.top-link span{margin-left:9px;color:#859465}.hero{display:grid;grid-template-columns:1fr 1fr;align-items:center;min-height:590px;padding:55px 0 62px;gap:7%}.hero-copy{padding:12px 0 0}.eyebrow{display:flex;align-items:center;gap:9px;margin:0 0 25px;color:#75766c;font-size:10px;font-weight:650;letter-spacing:.14em;text-transform:uppercase}.dot{width:7px;height:7px;border-radius:50%;background:#9aa977}h1{margin:0;font-size:clamp(72px,10vw,132px);line-height:.79;letter-spacing:-.095em;font-weight:560}h1 em{font-family:Georgia,"Times New Roman",serif;font-weight:400;letter-spacing:-.095em;color:#788653}.intro{max-width:390px;margin:34px 0 25px;font-family:Georgia,"Times New Roman",serif;font-size:21px;line-height:1.5;color:#64645b}.button{display:inline-flex;align-items:center;gap:32px;padding:15px 19px;background:#788653;color:white;text-decoration:none;font-size:12px;font-weight:600;transition:background .2s,transform .2s}.button:hover{background:#5f7040;transform:translateY(-2px)}.button-note{margin:11px 0 0;color:#89897f;font-size:10px}.art{position:relative;justify-self:center;width:min(100%,440px);aspect-ratio:1/1;display:grid;place-items:center}.sun{position:absolute;width:64%;height:64%;border-radius:50%;background:#e9ebdf}.orbit{position:absolute;width:89%;height:42%;border:1px solid #c8cdb8;border-radius:50%;transform:rotate(-34deg)}.orbit-two{width:75%;height:29%;transform:rotate(38deg);border-color:#d3d4c5}.tea{position:relative;width:154px;height:127px;margin-top:38px;border:2px solid #55594a;border-top:0;border-radius:8px 8px 48px 48px;background:#f7f5ef;z-index:1;overflow:visible}.tea:before{position:absolute;content:"";top:-5px;left:-5px;width:160px;height:12px;border:2px solid #55594a;border-radius:50%;background:#f7f5ef}.tea-liquid{position:absolute;left:3px;right:3px;top:8px;height:35px;border-radius:2px 2px 50% 50%;background:#bd895a;opacity:.8}.tea-handle{position:absolute;right:-43px;top:21px;width:48px;height:61px;border:2px solid #55594a;border-left:0;border-radius:0 50% 50% 0}.steam{position:absolute;top:-58px;left:45px;width:15px;height:43px;border-right:1px solid #9fa38f;border-radius:50%;transform:rotate(12deg)}.steam-two{left:91px;top:-72px;height:48px;transform:rotate(-12deg)}.spark{position:absolute;z-index:2;color:#8a9669}.spark-a{top:18%;right:24%;font-size:28px}.spark-b{bottom:22%;left:18%;font-size:40px}.spark-c{bottom:19%;right:21%;font-size:17px}.art-caption{position:absolute;right:3%;bottom:9%;font:italic 13px Georgia,serif;color:#858779}.talks{display:grid;grid-template-columns:1fr 2fr;gap:7%;padding:60px 0 70px;border-top:1px solid #dfded6}.talk-columns{display:grid;grid-template-columns:1fr 1fr;gap:25px}.talk-group>.eyebrow{margin:0 0 16px}.talk-card{min-height:185px;padding:22px 23px;border:1px solid #d9dccd;background:#eef0e7}.talk-date{color:#788653;font-size:10px;letter-spacing:.08em;text-transform:uppercase}.talk-card h2{margin:22px 0 6px;font-family:Georgia,serif;font-size:31px;font-weight:400;letter-spacing:-.04em}.talk-card p{margin:0;color:#74756c;font-size:12px}.talk-tag{display:inline-block;margin-top:19px;color:#858579;font-size:10px}.past .eyebrow{color:#858579}.empty-past{min-height:185px;display:flex;align-items:flex-start;gap:14px;padding:24px 0;border-top:1px solid #dfded6;color:#8b906f}.empty-past span{font-size:17px}.empty-past p{margin:0;color:#858579;font:italic 14px/1.7 Georgia,serif}.about{display:grid;grid-template-columns:1fr 2fr;gap:7%;padding:73px 0 80px;border-top:1px solid #dfded6}.section-label{font-size:10px;letter-spacing:.13em;text-transform:uppercase;color:#858579}.section-label span{margin-right:13px;color:#8b9868}.about-copy{max-width:670px}.about-copy h2{margin:-8px 0 25px;font-size:clamp(32px,4vw,48px);font-weight:500;line-height:1.12;letter-spacing:-.055em}.about-copy p{max-width:610px;color:#686960;font-size:14px;line-height:1.85}.principles{display:grid;grid-template-columns:1fr repeat(3,1fr);gap:23px;padding:28px 0 78px;border-top:1px solid #dfded6}.principles>.section-label{padding-top:11px}.principle-card{min-height:162px;padding:17px 18px;border:1px solid #dfded6;background:rgba(255,255,255,.2)}.principle-mark{color:#82905e;font-size:17px}.principle-card h3{margin:22px 0 8px;font-size:13px;font-weight:600}.principle-card p{margin:0;color:#73746a;font-size:11px;line-height:1.7}.boundary{display:grid;grid-template-columns:1fr 2fr;gap:7%;align-items:center;padding:27px 0;border-top:1px solid #dfded6;border-bottom:1px solid #dfded6}.boundary-mark{color:#859267;font-size:25px}.boundary .eyebrow{margin:0 0 9px;font-size:9px}.boundary p:last-child{max-width:650px;margin:0;color:#696a61;font-family:Georgia,serif;font-size:16px;line-height:1.6}footer{min-height:98px;display:flex;align-items:center;justify-content:space-between;gap:15px}footer>span{color:#858579;font:italic 12px Georgia,serif}.footer-link{color:#72804e;font-weight:600}
  @media(max-width:700px){main{padding:0 6%}.topbar{height:70px}.topbar nav{gap:14px}.top-link{font-size:10px}.hero{grid-template-columns:1fr;gap:15px;padding:75px 0 56px}.hero-copy{padding:0}h1{font-size:clamp(76px,19vw,120px)}.intro{font-size:19px}.art{width:min(88%,350px);margin:4px auto 0}.talks{grid-template-columns:1fr;gap:24px;padding:48px 0 55px}.talk-columns{grid-template-columns:1fr;gap:22px}.talk-card{min-height:155px}.empty-past{min-height:100px}.about{grid-template-columns:1fr;gap:28px;padding:54px 0}.about-copy h2{font-size:37px}.principles{grid-template-columns:1fr;gap:10px;padding-bottom:54px}.principles>.section-label{padding:0 0 11px}.principle-card{min-height:0;padding:16px}.principle-card h3{margin:10px 0 6px}.boundary{grid-template-columns:28px 1fr;gap:15px}.boundary p:last-child{font-size:15px}footer{flex-wrap:wrap;padding:22px 0;min-height:100px}footer>span{order:3;width:100%;text-align:center}}
  @media(prefers-reduced-motion:reduce){:global(html){scroll-behavior:auto}.button{transition:none}}
</style>
