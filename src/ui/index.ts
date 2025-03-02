class UIElments {
  get selectProgramControls() {
    const c = document.getElementById("select-program") as HTMLSelectElement;

    return c;
  }

  get loadProgramButton() {
    return document.getElementById("load-program") as HTMLButtonElement;
  }
}

export default new UIElments();
