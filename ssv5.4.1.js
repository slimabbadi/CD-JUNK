"use strict";
(() => {
  // bin/live-reload.js
  new EventSource(`${"http://localhost:3000"}/esbuild`).addEventListener("change", () => location.reload());

  // src/utils/sectionScrolling.js
  var SlideController = class {
    constructor() {
      this.slides = document.querySelectorAll("[data-info-section]");
      this.dots = document.querySelectorAll("[link]");
      this.next = document.querySelector("#next");
      this.prev = document.querySelector("#prev");
      this.scrollToggler = document.querySelectorAll(".togglescroll");
      this.scrollON = document.querySelectorAll(".scrollon");
      this.scrollOFF = document.querySelectorAll(".scrolloff");
      this.btt = document.querySelector("#btt-btn") || null;
      this.section_wrapper_intersection = null;
      this.slidesTotal = 12;
      this.dotsTotal = 12;
      this.activeSlide = 0;
      this.oldSlide = 0;
      this.scrolled = false;
      this.allowSnap = false;
      this.oldRaw = -1;
      this.toggleState = true;
      this.dur = parseFloat(
        document.querySelector("[data-sections-speed]")?.getAttribute("data-sections-speed")
      ) || 3;
      this.slowDur = this.dur;
      this.fastDur = this.dur;
      this.localDur = null;
      this.myease = "power3.in";
      this.swipeUp = null;
      this.swipeDown = null;
      this.swipeObserver = true;
      this.snappingState = false;
      this.slide = gsap.to(this.oldSlide, {});
      gsap.registerPlugin(ScrollToPlugin);
      this.init();
      window.addEventListener("wheel", this.slideAnim.bind(this), { passive: false });
      window.addEventListener("keydown", this.preventDefaultForScrollKeys, false);
      if (window.innerWidth <= 991) {
        this.bindTouchEvents();
      }
      this.addClickListeners();
    }
    /**
     * Initializes the intersection observer
     */
    init() {
      const options = {
        root: null,
        // use the viewport as the root
        rootMargin: "0px",
        threshold: 1
        // 20% of the full section should be visible
      };
      const observer = new IntersectionObserver(this.handleIntersection.bind(this), options);
      const wrapper = document.querySelectorAll("#section-scroll-toggler");
      wrapper.forEach((section) => {
        observer.observe(section);
      });
      const sectionsObserver = new IntersectionObserver(
        this.handleSectionsIntersection.bind(this),
        { threshold: 0.2 }
        // Add curly braces around the object literal
      );
      const sections = document.querySelectorAll("[data-info-section]");
      console.log({ sections });
      sections.forEach((section) => {
        sectionsObserver.observe(section);
      });
    }
    /**
     * Handles intersection changes
     * @param {IntersectionObserverEntry[]} entries - Array of intersection observer entries
     * @param {IntersectionObserver} observer - Intersection observer instance
     */
    handleSectionsIntersection(entries, observer) {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          console.table(" xxxx Inside ", entry.target.id);
          const currentObserved = parseInt(entry.target.getAttribute("data-info-section")) - 1;
          console.log({ currentObserved });
          console.log(this);
          console.log("setting up active dot", currentObserved);
          this.removeClassFromAllDots();
          this.addClassToDots(currentObserved);
        } else {
          console.log("Outside sectionsObserver");
        }
      });
    }
    /**
     * Handles intersection changes
     * @param {IntersectionObserverEntry[]} entries - Array of intersection observer entries
     * @param {IntersectionObserver} observer - Intersection observer instance
     */
    handleIntersection(entries, observer) {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          console.log("Inside the main section wrapper");
          this.section_wrapper_intersection = true;
        } else {
          console.log("Outside the main section wrapper");
          this.section_wrapper_intersection = false;
        }
      });
    }
    /**
     * Prevents default action for specified scroll keys
     * @param {Event} e - The event object
     */
    preventDefaultForScrollKeys(e) {
      const keys = { 37: 1, 38: 1, 39: 1, 40: 1, 32: 1, 33: 1, 34: 1, 35: 1, 36: 1 };
      if (keys[e.keyCode]) {
        e.preventDefault();
        return false;
      }
    }
    /**
     * Binds touch events for mobile swipe
     */
    bindTouchEvents() {
      let ts;
      document.addEventListener("touchstart", (e) => {
        ts = e.touches[0].clientY;
      });
      document.addEventListener("touchend", (e) => {
        const te = e.changedTouches[0].clientY;
        if (ts > te + 5) {
          console.log("down");
          this.swipeObserver = true;
          this.swipeDown = true;
          this.swipeUp = false;
          this.swipeAnim();
        } else if (ts < te - 5) {
          console.log("up");
          this.swipeObserver = true;
          this.swipeUp = true;
          this.swipeDown = false;
          this.swipeAnim();
        }
      });
    }
    /**
     * Adds click listeners to dots and buttons
     */
    addClickListeners() {
      console.log(this.dots.length, this.slides.length);
      console.log(this.dots, this.slides);
      if (this.dots.length == this.slides.length) {
        this.dots.forEach((dot, index) => {
          if (index < this.slides.length) {
            dot.addEventListener("click", () => {
              console.log("dot clicked");
              this.dotClick(index);
            });
          } else {
            dot.addEventListener("click", () => {
              console.log("empty function");
            });
          }
        });
      } else {
        console.log("slide length and dots length doesn't match !!!!!");
      }
      this.next && this.next.addEventListener("click", () => {
        this.slideDOWN(this.activeSlide);
      });
      this.prev && this.prev.addEventListener("click", () => {
        this.slideUP(this.activeSlide);
      });
      this.scrollToggler && this.scrollToggler.forEach((element) => {
        element.addEventListener("click", () => {
          this.toggleScroll();
        });
      });
      this.scrollON && this.scrollON.forEach((element) => {
        element.addEventListener("click", () => {
          this.enableScroll();
          this.toggleState = true;
        });
      });
      this.scrollOFF && this.scrollOFF.forEach((element) => {
        element.addEventListener("click", () => {
          this.disableScroll();
          this.toggleState = false;
        });
      });
      this.btt && this.btt.addEventListener("click", () => {
        this.scrollToTop();
      });
    }
    /**
     * Scrolls to the top of the page
     */
    scrollToTop() {
      window.scrollTo({
        top: 0,
        left: 0,
        behavior: "smooth"
      });
      this.removeClassFromAllDots();
      this.activeSlide = 0;
      this.addClassToDots(this.activeSlide);
    }
    /**
     * Enables scrolling
     */
    enableScroll() {
      window.removeEventListener("DOMMouseScroll", this.preventDefault, { passive: false });
      window.removeEventListener("wheel", this.preventDefault, { passive: false });
      window.removeEventListener("touchmove", this.preventDefault, { passive: false });
      window.removeEventListener("keydown", this.preventDefaultForScrollKeys, { passive: false });
      console.log("enable");
    }
    /**
     * Disables scrolling
     */
    disableScroll() {
      window.addEventListener("DOMMouseScroll", this.preventDefault, { passive: false });
      window.addEventListener("wheel", this.preventDefault, { passive: false });
      window.addEventListener("touchmove", this.preventDefault, { passive: false });
      window.addEventListener("keydown", this.preventDefaultForScrollKeys, { passive: false });
      console.log("disable");
    }
    /**
     * Toggles scrolling
     */
    toggleScroll() {
      if (!this.toggleState) {
        this.enableScroll();
      } else {
        this.disableScroll();
      }
      this.toggleState = !this.toggleState;
      console.log("%c scroll state flipped to : ", this.toggleState, " (true = Scroll ON)");
    }
    /**
     * Animates slides based on mouse wheel events
     * @param {Event} e - The event object
     */
    slideAnim(e) {
      if (window.innerWidth <= 991) {
        return;
      }
      if (!this.toggleState) {
        return;
      }
      if (!this.section_wrapper_intersection || window.innerWidth <= 991) {
        this.enableScroll();
        return;
      }
      e.preventDefault();
      console.log("scrolling prevented");
      if (this.activeSlide != 0 || this.activeSlide != this.slides.length - 1) {
        this.oldSlide = this.activeSlide;
      }
      if (gsap.isTweening(window)) {
        return;
      }
      if (!this.snappingState) {
        this.removeClassFromDots(this.activeSlide);
        let delta = this.deltaFliter(e.deltaY);
        if (delta == 0) {
          return;
        }
        this.activeSlide = delta > 0 ? this.activeSlide += 1 : this.activeSlide -= 1;
        this.activeSlide = this.activeSlide < 0 ? 0 : this.activeSlide;
        this.swipeObserver = false;
        this.activeSlide = this.activeSlide > this.slides.length - 1 ? this.slides.length - 1 : this.activeSlide;
        if (this.oldSlide === this.activeSlide) {
          return;
        }
      }
      this.allowSnap = false;
      this.addClassToDots(this.activeSlide);
      if ([0, 1, 2, 3].includes(this.activeSlide)) {
        this.localDur = this.slowDur;
      } else {
        this.localDur = this.fastDur;
      }
      if (this.oldSlide == 4 && this.activeSlide == 3) {
        this.localDur = this.fastDur;
      }
      console.log("old : ", this.oldSlide, "active : ", this.activeSlide);
      this.slide = gsap.to(window, {
        scrollTo: `#${this.slides[this.activeSlide].id}`,
        duration: this.localDur,
        ease: this.myease,
        onComplete: () => {
          this.snappingState = false;
        }
      });
    }
    /**
     * Animates slides based on swipe gestures
     */
    swipeAnim() {
      if (window.innerWidth <= 991) {
        return;
      }
      if (!this.toggleState) {
        return;
      }
      if (!this.section_wrapper_intersection || window.innerWidth <= 991) {
        this.enableScroll();
        return;
      }
      this.oldSlide = this.activeSlide;
      if (gsap.isTweening(window)) {
        return;
      }
      if (!this.snappingState) {
        console.log("swipe up ", this.swipeUp, "swipe down", this.swipeDown);
        if (this.swipeUp && this.slides[this.activeSlide - 1] != void 0) {
          this.removeClassFromDots(this.activeSlide);
          this.activeSlide--;
          console.log(" current active slide : ", this.activeSlide);
          console.log("activeSlide--");
        }
        if (this.swipeDown && this.slides[this.activeSlide + 1] != void 0) {
          this.removeClassFromDots(this.activeSlide);
          this.activeSlide++;
          console.log(" current active slide : ", this.activeSlide);
          console.log("activeSlide++");
        }
        this.swipeObserver = false;
        this.activeSlide = this.activeSlide < 0 ? 0 : this.activeSlide;
        this.activeSlide = this.activeSlide > this.slides.length - 1 ? this.slides.length - 1 : this.activeSlide;
        if (this.oldSlide === this.activeSlide) {
          return;
        }
      }
      this.allowSnap = false;
      this.addClassToDots(this.activeSlide);
      console.log("old : ", this.oldSlide, "active : ", this.activeSlide);
      if ([0, 1, 2, 3].includes(this.activeSlide)) {
        this.localDur = this.slowDur;
      } else {
        this.localDur = this.fastDur;
      }
      this.slide = gsap.to(window, {
        scrollTo: `#${this.slides[this.activeSlide].id}`,
        duration: this.localDur,
        ease: this.myease,
        onComplete: () => {
          this.snappingState = false;
        }
      });
    }
    /**
     * Filters the delta value
     * @param {number} e - The delta value
     * @returns {number} - The filtered delta value
     */
    deltaFliter(e) {
      if (this.snappingState) {
        console.log("returning 0 ");
        return 0;
      }
      if (e > 0) {
        this.snappingState = true;
        return 1;
      }
      this.snappingState = true;
      return -1;
    }
    /**
     * Handles dot click events
     * @param {number} index - The index of the clicked dot
     */
    dotClick(index) {
      if (!this.toggleState) {
        return;
      }
      this.removeClassFromAllDots();
      console.log("inside DotClick");
      console.log(this.slides[this.activeSlide].id);
      this.activeSlide = index;
      this.snappingState = true;
      if ([0, 1, 2, 3].includes(this.activeSlide)) {
        this.localDur = this.slowDur;
      } else {
        this.localDur = this.fastDur;
      }
      gsap.to(window, {
        scrollTo: `#${this.slides[this.activeSlide].id}`,
        duration: this.localDur,
        ease: this.myease,
        onComplete: () => {
          this.snappingState = false;
        }
      });
      this.addClassToDots(this.activeSlide);
    }
    /**
     * Slides up to the previous section
     * @param {number} currentSlide - The index of the current slide
     */
    slideUP(currentSlide) {
      if (!this.toggleState) {
        return;
      }
      console.log("slide DOWN CLICKED");
      if (this.slides[currentSlide - 1] != void 0) {
        this.removeClassFromAllDots();
        this.activeSlide--;
        this.snappingState = true;
        if ([0, 1, 2, 3].includes(this.activeSlide)) {
          this.localDur = this.slowDur;
        } else {
          this.localDur = this.fastDur;
        }
        gsap.to(window, {
          scrollTo: `#${this.slides[this.activeSlide].id}`,
          duration: this.localDur,
          ease: this.myease,
          onComplete: () => {
            this.snappingState = false;
          }
        });
        this.addClassToDots(this.activeSlide);
      } else {
        console.log("no slide");
      }
    }
    /**
     * Slides down to the next section
     * @param {number} currentSlide - The index of the current slide
     */
    slideDOWN(currentSlide) {
      if (!this.toggleState) {
        return;
      }
      console.log("slide DOWN CLICKED");
      if (this.slides[currentSlide + 1] != void 0) {
        this.removeClassFromAllDots();
        this.activeSlide++;
        this.snappingState = true;
        this.localDur = this.fastDur;
        gsap.to(window, {
          scrollTo: `#${this.slides[this.activeSlide].id}`,
          duration: this.localDur,
          ease: this.myease,
          onComplete: () => {
            this.snappingState = false;
          }
        });
        this.addClassToDots(this.activeSlide);
      } else {
        console.log("no slide");
      }
    }
    /**
     * Adds 'active' class to dots at specified index
     * @param {number} index - The index of the dot to be activated
     */
    addClassToDots(index) {
      if (index >= 0 && index < this.dots.length) {
        this.dots[index].classList.add("active");
      } else {
        console.error("Invalid index provided.");
      }
    }
    /**
     * Removes 'active' class from dots at specified index
     * @param {number} index - The index of the dot to be deactivated
     */
    removeClassFromDots(index) {
      if (index >= 0 && index < this.dots.length) {
        this.dots[index].classList.remove("active");
      } else {
        console.error("Invalid index provided.");
      }
    }
    /**
     * Removes 'active' class from all dots
     */
    removeClassFromAllDots() {
      if (this.dots.length > 0) {
        this.dots.forEach((dot) => {
          dot.classList.remove("active");
        });
      } else {
        console.error("No dots found.");
      }
    }
  };

  // src/index.ts
  window.Webflow ||= [];
  window.Webflow.push(() => {
    const slideController = new SlideController();
  });
})();
//# sourceMappingURL=index.js.map
