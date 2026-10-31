(function () {
  "use strict";
  const status = document.querySelector(".loyalty-status");
  document.querySelectorAll("[data-card-choice]").forEach((button) => {
    button.addEventListener("click", () => {
      status.textContent = `${button.dataset.cardChoice}: оформление пока недоступно.`;
    });
  });
})();
