let overlayCount = 0;

export const pushOverlay = () => {
  overlayCount++;
};

export const popOverlay = () => {
  overlayCount = Math.max(0, overlayCount - 1);
};

export const hasOpenOverlay = () => overlayCount > 0;
