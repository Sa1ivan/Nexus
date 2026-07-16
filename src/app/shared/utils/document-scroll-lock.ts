interface DocumentLockState {
  count: number;
  readonly rootOverflow: string;
  readonly bodyOverflow: string;
  readonly bodyPaddingRight: string;
}

const activeLocks = new WeakMap<Document, DocumentLockState>();

export function lockDocumentScroll(documentRef: Document): () => void {
  const currentLock = activeLocks.get(documentRef);

  if (currentLock !== undefined) {
    currentLock.count += 1;
    return createUnlock(documentRef, currentLock);
  }

  const root = documentRef.documentElement;
  const body = documentRef.body;
  const lockState: DocumentLockState = {
    count: 1,
    rootOverflow: root.style.overflow,
    bodyOverflow: body.style.overflow,
    bodyPaddingRight: body.style.paddingRight,
  };
  const viewportWidth = documentRef.defaultView?.innerWidth ?? root.clientWidth;
  const scrollbarWidth = Math.max(0, viewportWidth - root.clientWidth);

  root.style.overflow = 'hidden';
  body.style.overflow = 'hidden';

  if (scrollbarWidth > 0) {
    body.style.paddingRight = `${scrollbarWidth}px`;
  }

  activeLocks.set(documentRef, lockState);
  return createUnlock(documentRef, lockState);
}

function createUnlock(documentRef: Document, lockState: DocumentLockState): () => void {
  let released = false;

  return () => {
    if (released) {
      return;
    }

    released = true;
    lockState.count -= 1;

    if (lockState.count > 0) {
      return;
    }

    documentRef.documentElement.style.overflow = lockState.rootOverflow;
    documentRef.body.style.overflow = lockState.bodyOverflow;
    documentRef.body.style.paddingRight = lockState.bodyPaddingRight;
    activeLocks.delete(documentRef);
  };
}
