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

  // ---------- Glass box: grow on hover/hold, drag to reposition ----------
  //
  // #glass-box's CENTER point is tracked as (centerX, centerY) and
  // written to its `left`/`top` (px); CSS keeps it self-centered via
  // `transform: translate(-50%, -50%)`, so re-centering after a size
  // change is automatic. Size (rest ~10% vs. grown ~80% of the screen)
  // is toggled with the `.grown` class and animated by the CSS
  // transition declared on #glass-box.
  //
  // Because position and size can now change independently (and size
  // animates on its own CSS timeline), #glass-peek's compensating
  // transform is kept in sync continuously via requestAnimationFrame,
  // reading #glass-box's live rendered rect every frame rather than
  // being computed only when position changes. That's what preserves
  // the "wherever the box is, it shows that part of the next photo"
  // lens effect while it's also resizing.

  const DRAG_THRESHOLD_PX = 4;

  let centerX = 0;
  let centerY = 0;
  let homeX = 0;
  let homeY = 0;
  let isDragging = false;
  let dragMoved = false;
  let dragStartClientX = 0;
  let dragStartClientY = 0;
  let dragStartCenterX = 0;
  let dragStartCenterY = 0;

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function setBoxCenter(x, y) {
    centerX = x;
    centerY = y;
    glassBox.style.left = `${x}px`;
    glassBox.style.top = `${y}px`;
  }

  function computeHomePosition() {
    homeX = window.innerWidth / 2;
    homeY = window.innerHeight / 2;
  }

  function moveToHome() {
    glassBox.classList.remove("grown");
    setBoxCenter(homeX, homeY);
  }

  function syncPeekToBox() {
    // While dragging, the box's size can keep animating (grow) even
    // with the cursor stationary, so re-clamp its center every frame —
    // not just on mousemove — or a corner-anchored box could grow
    // past the viewport edge before the next cursor movement.
    if (isDragging) {
      const halfW = glassBox.offsetWidth / 2;
      const halfH = glassBox.offsetHeight / 2;
      const clampedX = clamp(centerX, halfW, window.innerWidth - halfW);
      const clampedY = clamp(centerY, halfH, window.innerHeight - halfH);
      if (clampedX !== centerX || clampedY !== centerY) {
        setBoxCenter(clampedX, clampedY);
      }
    }
    const rect = glassBox.getBoundingClientRect();
    glassPeek.style.transform = `translate(${-rect.left}px, ${-rect.top}px)`;
    requestAnimationFrame(syncPeekToBox);
  }

  computeHomePosition();
  setBoxCenter(homeX, homeY);
  requestAnimationFrame(syncPeekToBox);

  window.addEventListener("resize", () => {
    computeHomePosition();
    if (!isDragging) moveToHome();
  });

  glassBox.addEventListener("mouseenter", () => {
    glassBox.classList.add("grown");
  });

  glassBox.addEventListener("mouseleave", () => {
    if (!isDragging) glassBox.classList.remove("grown");
  });

  glassBox.addEventListener("mousedown", (e) => {
    isDragging = true;
    dragMoved = false;
    dragStartClientX = e.clientX;
    dragStartClientY = e.clientY;
    dragStartCenterX = centerX;
    dragStartCenterY = centerY;
    glassBox.classList.add("grown", "dragging");
  });

  window.addEventListener("mousemove", (e) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStartClientX;
    const dy = e.clientY - dragStartClientY;
    if (Math.abs(dx) > DRAG_THRESHOLD_PX || Math.abs(dy) > DRAG_THRESHOLD_PX) {
      dragMoved = true;
    }
    const halfW = glassBox.offsetWidth / 2;
    const halfH = glassBox.offsetHeight / 2;
    setBoxCenter(
      clamp(dragStartCenterX + dx, halfW, window.innerWidth - halfW),
      clamp(dragStartCenterY + dy, halfH, window.innerHeight - halfH)
    );
  });

  window.addEventListener("mouseup", () => {
    if (!isDragging) return;
    isDragging = false;
    glassBox.classList.remove("dragging");
    moveToHome();
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
