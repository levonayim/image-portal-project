(function () {
  const photos = (typeof PHOTOS !== "undefined" && Array.isArray(PHOTOS)) ? PHOTOS : [];

  const emptyState = document.getElementById("empty-state");
  const glassBox = document.getElementById("glass-box");
  const glassPeek = document.getElementById("glass-peek");
  const navPrev = document.getElementById("nav-prev");
  const navNext = document.getElementById("nav-next");
  const captionEl = document.getElementById("caption");

  if (photos.length === 0) {
    emptyState.classList.add("visible");
    glassBox.style.display = "none";
    navPrev.style.display = "none";
    navNext.style.display = "none";
    return;
  }

  let currentIndex = 0;
  let activeLayer = document.getElementById("bg-layer-a");
  let standbyLayer = document.getElementById("bg-layer-b");

  function preload(src) {
    const img = new Image();
    img.src = src;
    return img;
  }

  function setBackground(layer, photo) {
    layer.style.backgroundImage = `url("${photo.src}")`;
  }

  function updateGlassPeek() {
    const nextPhoto = photos[(currentIndex + 1) % photos.length];
    glassPeek.style.backgroundImage = `url("${nextPhoto.src}")`;
    preload(nextPhoto.src);
  }

  function updateCaption(photo) {
    captionEl.textContent = photo.caption || "";
  }

  function renderInitial() {
    const photo = photos[currentIndex];
    setBackground(activeLayer, photo);
    activeLayer.classList.add("active");
    updateCaption(photo);
    updateGlassPeek();
  }

  function advance(direction) {
    if (photos.length < 2) return;
    currentIndex = (currentIndex + photos.length + direction) % photos.length;
    const photo = photos[currentIndex];

    setBackground(standbyLayer, photo);
    standbyLayer.classList.add("active");
    activeLayer.classList.remove("active");

    const temp = activeLayer;
    activeLayer = standbyLayer;
    standbyLayer = temp;

    updateCaption(photo);
    updateGlassPeek();
  }

  // ---------- Drag the glass box around the screen ----------
  //
  // #glass-box is positioned via `transform: translate(boxX, boxY)`.
  // #glass-peek (see styles.css) is a full-viewport copy of the next
  // photo that always carries the exact opposite transform, so it
  // stays visually pinned to the viewport no matter where the box is.
  // The result: wherever you drag the box, its clipped window shows
  // exactly that region of the next photo, as if it were a lens held
  // up to a full-size picture fixed behind the page.

  const DRAG_THRESHOLD_PX = 4;
  const SNAP_BACK_MS = 400;

  let boxX = 0;
  let boxY = 0;
  let homeX = 0;
  let homeY = 0;
  let isDragging = false;
  let dragMoved = false;
  let dragStartClientX = 0;
  let dragStartClientY = 0;
  let dragStartBoxX = 0;
  let dragStartBoxY = 0;

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function setBoxPosition(x, y) {
    boxX = x;
    boxY = y;
    glassBox.style.transform = `translate(${x}px, ${y}px)`;
    glassPeek.style.transform = `translate(${-x}px, ${-y}px)`;
  }

  function computeHomePosition() {
    homeX = (window.innerWidth - glassBox.offsetWidth) / 2;
    homeY = (window.innerHeight - glassBox.offsetHeight) / 2;
  }

  function moveToHome(animate) {
    const transition = animate ? `transform ${SNAP_BACK_MS}ms cubic-bezier(0.22, 1, 0.36, 1)` : "none";
    glassBox.style.transition = transition;
    glassPeek.style.transition = transition;
    setBoxPosition(homeX, homeY);
  }

  computeHomePosition();
  moveToHome(false);

  window.addEventListener("resize", () => {
    computeHomePosition();
    if (!isDragging) moveToHome(false);
  });

  glassBox.addEventListener("mousedown", (e) => {
    isDragging = true;
    dragMoved = false;
    dragStartClientX = e.clientX;
    dragStartClientY = e.clientY;
    dragStartBoxX = boxX;
    dragStartBoxY = boxY;
    glassBox.style.transition = "none";
    glassPeek.style.transition = "none";
  });

  window.addEventListener("mousemove", (e) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStartClientX;
    const dy = e.clientY - dragStartClientY;
    if (Math.abs(dx) > DRAG_THRESHOLD_PX || Math.abs(dy) > DRAG_THRESHOLD_PX) {
      dragMoved = true;
    }
    const maxX = window.innerWidth - glassBox.offsetWidth;
    const maxY = window.innerHeight - glassBox.offsetHeight;
    setBoxPosition(
      clamp(dragStartBoxX + dx, 0, maxX),
      clamp(dragStartBoxY + dy, 0, maxY)
    );
  });

  window.addEventListener("mouseup", () => {
    if (!isDragging) return;
    isDragging = false;
    moveToHome(true);
  });

  // ---------- Interaction ----------

  glassBox.addEventListener("click", () => {
    if (dragMoved) {
      dragMoved = false;
      return;
    }
    advance(1);
  });
  navNext.addEventListener("click", () => advance(1));
  navPrev.addEventListener("click", () => advance(-1));

  document.addEventListener("keydown", (e) => {
    if (e.key === "ArrowRight") advance(1);
    if (e.key === "ArrowLeft") advance(-1);
    if (e.key === "Enter" && document.activeElement === glassBox) advance(1);
  });

  renderInitial();
})();
