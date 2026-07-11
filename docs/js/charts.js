/* R&R — interactive article charts (vanilla, no library)
   Two behaviours, both progressive enhancements over the static SVG/CSS charts:
     1. .svg-chart[data-points]  → FT-style hover crosshair + tooltip
     2. .ichart[data-chart]      → clickable year tabs that re-draw horizontal bars
   Points/data are authored inline in the HTML; this file only wires behaviour. */
(function () {
  "use strict";
  var SVGNS = "http://www.w3.org/2000/svg";

  /* ----------------------------------------------------------------
     1. Hover crosshair + tooltip for time-series line charts.
        data-points = "label|cx|cy|value ; label|cx|cy|value ; ..."
        Coordinates are in the chart's own viewBox user units.
     ---------------------------------------------------------------- */
  function initLineHover(svg) {
    var pts = svg.dataset.points.split(";").map(function (s) {
      var p = s.split("|");
      return { label: p[0].trim(), cx: +p[1], cy: +p[2], val: p[3].trim() };
    });
    if (!pts.length) return;

    var plot = (svg.dataset.plot || "18,268").split(",").map(Number);
    var top = plot[0], bottom = plot[1];
    var xMin = pts[0].cx, xMax = pts[pts.length - 1].cx;

    var g = el("g", { class: "hx-layer" });
    g.style.display = "none";
    g.style.pointerEvents = "none";
    var line = el("line", { class: "hx-line" });
    var dot = el("circle", { class: "hx-dot", r: 5.5 });
    var box = el("rect", { class: "hx-box", rx: 4, ry: 4 });
    var t1 = el("text", { class: "hx-t1" });
    var t2 = el("text", { class: "hx-t2" });
    g.appendChild(line); g.appendChild(dot); g.appendChild(box);
    g.appendChild(t1); g.appendChild(t2);
    svg.appendChild(g);

    function toUser(evt) {
      var pt = svg.createSVGPoint();
      var src = evt.touches ? evt.touches[0] : evt;
      pt.x = src.clientX; pt.y = src.clientY;
      return pt.matrixTransform(svg.getScreenCTM().inverse());
    }

    function place(best) {
      line.setAttribute("x1", best.cx); line.setAttribute("x2", best.cx);
      line.setAttribute("y1", top); line.setAttribute("y2", bottom);
      dot.setAttribute("cx", best.cx); dot.setAttribute("cy", best.cy);
      t1.textContent = best.label;
      t2.textContent = best.val;
      var padX = 9, padY = 7, lh = 16;
      var w = Math.max(t1.getComputedTextLength(), t2.getComputedTextLength());
      var bw = w + padX * 2, bh = padY * 2 + lh * 2 - 2;
      var bx = best.cx - bw / 2;
      bx = Math.max(xMin - 6, Math.min(bx, xMax + 6 - bw));
      var by = best.cy - 14 - bh;
      if (by < top) by = best.cy + 14;
      box.setAttribute("x", bx); box.setAttribute("y", by);
      box.setAttribute("width", bw); box.setAttribute("height", bh);
      box.setAttribute("opacity", 0.93);
      t1.setAttribute("x", bx + padX); t1.setAttribute("y", by + padY + 12);
      t2.setAttribute("x", bx + padX); t2.setAttribute("y", by + padY + 12 + lh);
    }

    function move(evt) {
      var u = toUser(evt), best = pts[0], bd = Infinity;
      for (var i = 0; i < pts.length; i++) {
        var d = Math.abs(pts[i].cx - u.x);
        if (d < bd) { bd = d; best = pts[i]; }
      }
      g.style.display = "";
      place(best);
      if (evt.touches) evt.preventDefault();
    }
    function hide() { g.style.display = "none"; }

    svg.addEventListener("mousemove", move);
    svg.addEventListener("mouseleave", hide);
    svg.addEventListener("touchstart", move, { passive: false });
    svg.addEventListener("touchmove", move, { passive: false });
    svg.addEventListener("touchend", hide);
  }

  /* ----------------------------------------------------------------
     2. Interactive year-explorer: clickable tabs redraw the bars.
        Config lives in a JSON data-chart attribute on .ichart.
     ---------------------------------------------------------------- */
  function initExplorer(root) {
    var cfg;
    try { cfg = JSON.parse(root.dataset.chart); }
    catch (e) { return; }
    var years = Object.keys(cfg.years);
    var max = cfg.max || 100;
    var unit = cfg.unit || "";

    var tabs = div("ichart-tabs");
    tabs.setAttribute("role", "tablist");
    var readout = div("ichart-readout");
    var bars = div("hbars");

    cfg.series.forEach(function (s) {
      var row = div("hbar");
      var lblStyle = s.mut ? ' style="color:var(--slate)"' : "";
      row.innerHTML =
        '<div class="hbar-label"' + lblStyle + ">" + s.label + "</div>" +
        '<div class="hbar-track"><div class="hbar-fill" style="--value:0%;--k:' + s.color + '"></div></div>' +
        '<div class="hbar-val"' + lblStyle + "></div>";
      bars.appendChild(row);
    });

    function select(yr) {
      var vals = cfg.years[yr];
      cfg.series.forEach(function (s, i) {
        var row = bars.children[i];
        row.querySelector(".hbar-fill").style.setProperty("--value", (vals[i] / max * 100) + "%");
        row.querySelector(".hbar-val").textContent = fmt(vals[i]) + unit;
      });
      Array.prototype.forEach.call(tabs.children, function (b) {
        b.setAttribute("aria-selected", b.dataset.year === yr ? "true" : "false");
      });
      if (cfg.readouts && cfg.readouts[yr]) readout.innerHTML = cfg.readouts[yr];
    }

    years.forEach(function (yr) {
      var b = document.createElement("button");
      b.className = "ichart-tab";
      b.type = "button";
      b.setAttribute("role", "tab");
      b.dataset.year = yr;
      b.textContent = yr;
      b.addEventListener("click", function () { select(yr); });
      tabs.appendChild(b);
    });

    root.appendChild(tabs);
    if (cfg.readouts) root.appendChild(readout);
    root.appendChild(bars);
    select(cfg.default || years[years.length - 1]);
  }

  /* ---- tiny helpers ---- */
  function el(name, attrs) {
    var e = document.createElementNS(SVGNS, name);
    for (var k in attrs) e.setAttribute(k, attrs[k]);
    return e;
  }
  function div(cls) { var d = document.createElement("div"); d.className = cls; return d; }
  function fmt(v) { return String(v).replace(".", ","); }

  function boot() {
    document.querySelectorAll(".svg-chart[data-points]").forEach(initLineHover);
    document.querySelectorAll(".ichart[data-chart]").forEach(initExplorer);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
