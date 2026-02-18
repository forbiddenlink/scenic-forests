const menuBtn = document.getElementById('menu-btn');
const primaryNav = document.getElementById('primary-nav');
const navLinks = primaryNav ? Array.from(primaryNav.querySelectorAll('a')) : [];
const isDesktop = () => window.matchMedia('(min-width: 980px)').matches;

const ANALYTICS_STORAGE_KEY = 'scenic_analytics_events';

const trackEvent = (name, payload = {}) => {
    const event = {
        name,
        payload,
        path: window.location.pathname,
        timestamp: new Date().toISOString(),
    };

    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({ event: name, ...payload });

    try {
        const stored = JSON.parse(localStorage.getItem(ANALYTICS_STORAGE_KEY) || '[]');
        stored.unshift(event);
        localStorage.setItem(ANALYTICS_STORAGE_KEY, JSON.stringify(stored.slice(0, 60)));
    } catch {
        // Ignore storage failures (private mode, quota, etc.)
    }

    if (typeof window.SCENIC_ANALYTICS_ENDPOINT === 'string' && navigator.sendBeacon) {
        const blob = new Blob([JSON.stringify(event)], { type: 'application/json' });
        navigator.sendBeacon(window.SCENIC_ANALYTICS_ENDPOINT, blob);
    }
};

const setNavState = (isOpen) => {
    if (!menuBtn || !primaryNav) return;

    const open = isDesktop() ? false : isOpen;
    menuBtn.setAttribute('aria-expanded', String(open));
    primaryNav.classList.toggle('is-open', open);
    document.body.classList.toggle('nav-open', open);
    document.body.classList.toggle('no-scroll', open);
};

if (menuBtn && primaryNav) {
    setNavState(false);

    menuBtn.addEventListener('click', () => {
        const shouldOpen = menuBtn.getAttribute('aria-expanded') !== 'true';
        setNavState(shouldOpen);
        trackEvent('menu_toggle', { open: shouldOpen });
    });

    navLinks.forEach((link) => {
        link.addEventListener('click', () => {
            if (!isDesktop()) {
                setNavState(false);
            }
        });
    });

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
            setNavState(false);
        }
    });

    document.addEventListener('click', (event) => {
        if (isDesktop()) return;

        const clickTarget = event.target;
        const navIsOpen = menuBtn.getAttribute('aria-expanded') === 'true';
        if (!navIsOpen) return;

        if (!primaryNav.contains(clickTarget) && !menuBtn.contains(clickTarget)) {
            setNavState(false);
        }
    });

    window.addEventListener('resize', () => {
        if (isDesktop()) {
            setNavState(false);
        }
    });
}

const initAnalyticsClicks = () => {
    document.addEventListener('click', (event) => {
        const interactive = event.target.closest('a, button');
        if (!interactive) return;

        const trackedClassNames = [
            'nav-cta',
            'btn-primary',
            'btn-secondary',
            'card-link',
            'inline-btn',
            'floating-cta-link',
            'carousel-btn',
            'dot',
        ];

        const shouldTrack = trackedClassNames.some((className) => interactive.classList.contains(className));
        if (!shouldTrack) return;

        const label = (interactive.textContent || '').trim().slice(0, 80);
        const href = interactive.getAttribute('href') || '';

        trackEvent('ui_click', {
            label,
            href,
            classes: interactive.className,
        });
    });
};

const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
const prefersReducedMotion = reducedMotionQuery.matches;
const revealEls = document.querySelectorAll('.reveal');

if (revealEls.length > 0) {
    if (prefersReducedMotion || !('IntersectionObserver' in window)) {
        revealEls.forEach((el) => el.classList.add('revealed'));
    } else {
        const revealObserver = new IntersectionObserver(
            (entries, observer) => {
                entries.forEach((entry) => {
                    if (!entry.isIntersecting) return;
                    entry.target.classList.add('revealed');
                    observer.unobserve(entry.target);
                });
            },
            {
                rootMargin: '0px 0px -8% 0px',
                threshold: 0.15,
            }
        );

        revealEls.forEach((el) => revealObserver.observe(el));
    }
}

const currencyFormat = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
});

const dateFormat = new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
});

const parseDate = (value) => {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
};

const calculateNights = (start, end) => {
    if (!start || !end) return 0;

    const startDate = parseDate(start);
    const endDate = parseDate(end);

    if (!startDate || !endDate) return 0;
    const milliseconds = endDate.getTime() - startDate.getTime();
    return milliseconds > 0 ? Math.ceil(milliseconds / (1000 * 60 * 60 * 24)) : 0;
};

const initFloatingCta = () => {
    const isReservationsPath = window.location.pathname.endsWith('/reservations.html') || window.location.pathname.endsWith('/reservations');
    if (isReservationsPath) return;

    const storageKey = 'scenic_floating_cta_dismissed_v1';

    let floatingCta = document.getElementById('floatingCta');
    if (!floatingCta) {
        floatingCta = document.createElement('aside');
        floatingCta.id = 'floatingCta';
        floatingCta.className = 'floating-cta';
        floatingCta.hidden = true;
        floatingCta.setAttribute('aria-label', 'Quick reservation call to action');
        floatingCta.innerHTML = `
            <p>Planning a stay? Lock in your preferred dates now.</p>
            <a href="reservations.html" class="btn btn-primary floating-cta-link">Reserve in 2 minutes</a>
            <button type="button" class="floating-close" id="floatingCtaClose" aria-label="Dismiss booking prompt">Dismiss</button>
        `;
        document.body.append(floatingCta);
    }

    let dismissed = false;
    try {
        dismissed = localStorage.getItem(storageKey) === '1';
    } catch {
        dismissed = false;
    }

    if (dismissed) return;

    const closeBtn = floatingCta.querySelector('#floatingCtaClose');
    const ctaLink = floatingCta.querySelector('.floating-cta-link');

    floatingCta.hidden = false;
    document.body.classList.add('has-floating-cta');

    closeBtn?.addEventListener('click', () => {
        floatingCta.hidden = true;
        document.body.classList.remove('has-floating-cta');
        try {
            localStorage.setItem(storageKey, '1');
        } catch {
            // Ignore storage failures.
        }
        trackEvent('floating_cta_dismissed');
    });

    ctaLink?.addEventListener('click', () => {
        trackEvent('floating_cta_clicked');
    });
};

const initTestimonialCarousel = () => {
    const carousel = document.getElementById('testimonialCarousel');
    if (!carousel) return;

    const slides = Array.from(carousel.querySelectorAll('[data-slide]'));
    const dots = Array.from(carousel.querySelectorAll('.dot'));
    const prevBtn = document.getElementById('carouselPrev');
    const nextBtn = document.getElementById('carouselNext');

    if (slides.length < 2) return;

    let activeIndex = 0;
    let intervalId = null;

    const setActive = (nextIndex, userAction = false) => {
        activeIndex = (nextIndex + slides.length) % slides.length;

        slides.forEach((slide, index) => {
            slide.classList.toggle('is-active', index === activeIndex);
        });

        dots.forEach((dot, index) => {
            dot.classList.toggle('is-active', index === activeIndex);
        });

        if (userAction) {
            trackEvent('testimonial_slide_change', { index: activeIndex + 1 });
        }
    };

    const stopAutoPlay = () => {
        if (intervalId) {
            clearInterval(intervalId);
            intervalId = null;
        }
    };

    const startAutoPlay = () => {
        stopAutoPlay();
        if (prefersReducedMotion) return;

        intervalId = window.setInterval(() => {
            setActive(activeIndex + 1);
        }, 5500);
    };

    prevBtn?.addEventListener('click', () => {
        setActive(activeIndex - 1, true);
    });

    nextBtn?.addEventListener('click', () => {
        setActive(activeIndex + 1, true);
    });

    dots.forEach((dot) => {
        dot.addEventListener('click', () => {
            const index = Number(dot.dataset.index || 0);
            setActive(index, true);
        });
    });

    carousel.addEventListener('mouseenter', stopAutoPlay);
    carousel.addEventListener('mouseleave', startAutoPlay);
    carousel.addEventListener('focusin', stopAutoPlay);
    carousel.addEventListener('focusout', startAutoPlay);

    setActive(0);
    startAutoPlay();
};

const initCabinFilters = () => {
    const cabinsGrid = document.querySelector('.cabin-grid');
    const cabinCards = cabinsGrid ? Array.from(cabinsGrid.querySelectorAll('[data-cabin]')) : [];

    if (!cabinsGrid || cabinCards.length === 0) return;

    const filterGuests = document.getElementById('filterGuests');
    const filterPrice = document.getElementById('filterPrice');
    const filterPets = document.getElementById('filterPets');
    const sortCabins = document.getElementById('sortCabins');
    const clearFilters = document.getElementById('clearFilters');
    const resultsCount = document.getElementById('resultsCount');
    const emptyResults = document.getElementById('emptyResults');

    if (!filterGuests || !filterPrice || !filterPets || !sortCabins || !clearFilters || !resultsCount || !emptyResults) {
        return;
    }

    const records = cabinCards.map((card, featuredIndex) => {
        const listItem = card.closest('li');
        return {
            card,
            listItem,
            featuredIndex,
            price: Number(card.dataset.price || 0),
            sleeps: Number(card.dataset.sleeps || 0),
            petFriendly: card.dataset.petFriendly === 'yes',
            name: (card.dataset.name || '').toLowerCase(),
            matches: true,
        };
    });

    const applyFiltersAndSort = (emitEvent = false) => {
        const minGuests = Number(filterGuests.value || 0);
        const maxPrice = Number(filterPrice.value || 0);
        const petsOnly = filterPets.value === 'yes';
        const sortValue = sortCabins.value;

        records.forEach((record) => {
            const passesGuests = minGuests ? record.sleeps >= minGuests : true;
            const passesPrice = maxPrice ? record.price <= maxPrice : true;
            const passesPets = petsOnly ? record.petFriendly : true;

            record.matches = passesGuests && passesPrice && passesPets;
            if (record.listItem) {
                record.listItem.hidden = !record.matches;
            }
        });

        const visible = records.filter((record) => record.matches);

        visible.sort((a, b) => {
            if (sortValue === 'price-asc') return a.price - b.price;
            if (sortValue === 'price-desc') return b.price - a.price;
            if (sortValue === 'name-asc') return a.name.localeCompare(b.name);
            return a.featuredIndex - b.featuredIndex;
        });

        const hidden = records.filter((record) => !record.matches);
        const nextOrder = [...visible, ...hidden];

        nextOrder.forEach((record) => {
            if (record.listItem) {
                cabinsGrid.append(record.listItem);
            }
        });

        const label = visible.length === 1 ? 'cabin' : 'cabins';
        resultsCount.textContent = `Showing ${visible.length} ${label}`;
        emptyResults.hidden = visible.length !== 0;

        if (emitEvent) {
            trackEvent('cabin_filters_changed', {
                minGuests,
                maxPrice,
                petsOnly,
                sortValue,
                resultCount: visible.length,
            });
        }
    };

    [filterGuests, filterPrice, filterPets, sortCabins].forEach((element) => {
        element.addEventListener('change', () => applyFiltersAndSort(true));
    });

    clearFilters.addEventListener('click', () => {
        filterGuests.value = '';
        filterPrice.value = '';
        filterPets.value = '';
        sortCabins.value = 'featured';
        applyFiltersAndSort(true);
    });

    applyFiltersAndSort();
};

const initFaqSearch = () => {
    const searchInput = document.getElementById('faqSearch');
    const resultCount = document.getElementById('faqSearchCount');
    const emptyState = document.getElementById('faqEmptyState');
    const faqItems = Array.from(document.querySelectorAll('[data-faq-item]'));

    if (!searchInput || !resultCount || !emptyState || faqItems.length === 0) return;

    let timer = null;

    const applyFaqSearch = (emitEvent = false) => {
        const query = searchInput.value.trim().toLowerCase();
        let visibleCount = 0;

        faqItems.forEach((item) => {
            const summary = item.querySelector('summary')?.textContent || '';
            const detail = item.querySelector('p')?.textContent || '';
            const text = `${summary} ${detail}`.toLowerCase();
            const matches = query.length === 0 ? true : text.includes(query);
            item.hidden = !matches;
            if (matches) visibleCount += 1;
        });

        const label = visibleCount === 1 ? 'question' : 'questions';
        resultCount.textContent = `Showing ${visibleCount} ${label}`;
        emptyState.hidden = visibleCount !== 0;

        if (emitEvent) {
            trackEvent('faq_search', { queryLength: query.length, resultCount: visibleCount });
        }
    };

    searchInput.addEventListener('input', () => {
        applyFaqSearch();
        if (timer) {
            clearTimeout(timer);
        }
        timer = window.setTimeout(() => {
            applyFaqSearch(true);
        }, 450);
    });

    applyFaqSearch();
};

const initReservationForm = () => {
    const bookingForm = document.getElementById('bookingForm');
    const formStatus = document.getElementById('formStatus');

    if (!bookingForm) return;

    const cabinSelect = document.getElementById('cabin');
    const checkIn = document.getElementById('checkIn');
    const checkOut = document.getElementById('checkOut');
    const guests = document.getElementById('guests');

    const summaryCabin = document.getElementById('summaryCabin');
    const summaryDates = document.getElementById('summaryDates');
    const summaryGuests = document.getElementById('summaryGuests');
    const summaryNights = document.getElementById('summaryNights');
    const summarySubtotal = document.getElementById('summarySubtotal');

    const cabinRates = {
        'whispering-willows': 280,
        'pine-haven': 220,
        'forest-ridge': 340,
        'cedar-creek': 195,
        'maple-grove': 265,
        'birch-haven': 245,
    };

    const showFormStatus = (type, message) => {
        if (!formStatus) return;

        formStatus.textContent = message;
        formStatus.classList.add('is-visible');
        formStatus.classList.toggle('is-error', type === 'error');
        formStatus.classList.toggle('is-success', type === 'success');
    };

    const updateEstimate = () => {
        if (!cabinSelect || !checkIn || !checkOut || !guests) return;

        const selectedCabin = cabinSelect.value;
        const selectedCabinLabel = cabinSelect.options[cabinSelect.selectedIndex]?.text || 'Not selected';
        const nightlyRate = cabinRates[selectedCabin] || 0;
        const nights = calculateNights(checkIn.value, checkOut.value);
        const subtotal = nights * nightlyRate;

        if (summaryCabin) {
            summaryCabin.textContent = selectedCabin ? selectedCabinLabel : 'Not selected';
        }

        if (summaryDates) {
            const startDate = parseDate(checkIn.value);
            const endDate = parseDate(checkOut.value);
            summaryDates.textContent = startDate && endDate
                ? `${dateFormat.format(startDate)} - ${dateFormat.format(endDate)}`
                : 'Choose check-in and check-out';
        }

        if (summaryGuests) {
            const guestCount = guests.value ? Number(guests.value) : 0;
            summaryGuests.textContent = guestCount ? `${guestCount} ${guestCount === 1 ? 'guest' : 'guests'}` : 'Choose guest count';
        }

        if (summaryNights) {
            summaryNights.textContent = `${nights} ${nights === 1 ? 'night' : 'nights'}`;
        }

        if (summarySubtotal) {
            summarySubtotal.textContent = subtotal > 0 ? currencyFormat.format(subtotal) : '$0';
        }
    };

    const applyMinimumDates = () => {
        if (!checkIn || !checkOut) return;

        const today = new Date();
        const todayIso = today.toISOString().split('T')[0];
        checkIn.min = todayIso;

        const baseDate = checkIn.value ? new Date(checkIn.value) : today;
        baseDate.setDate(baseDate.getDate() + 1);
        const minimumCheckOut = baseDate.toISOString().split('T')[0];
        checkOut.min = minimumCheckOut;

        if (checkOut.value && checkOut.value <= checkIn.value) {
            checkOut.value = minimumCheckOut;
        }

        updateEstimate();
    };

    applyMinimumDates();

    const urlParams = new URLSearchParams(window.location.search);
    const selectedCabinFromUrl = urlParams.get('cabin');
    if (cabinSelect && selectedCabinFromUrl) {
        cabinSelect.value = selectedCabinFromUrl;
    }

    [cabinSelect, checkIn, checkOut, guests].forEach((input) => {
        input?.addEventListener('change', () => {
            if (input === checkIn) {
                applyMinimumDates();
            }
            updateEstimate();
        });
    });

    updateEstimate();

    bookingForm.addEventListener('submit', (event) => {
        event.preventDefault();

        if (!bookingForm.checkValidity()) {
            showFormStatus('error', 'Please complete all required fields before submitting.');
            bookingForm.reportValidity();
            trackEvent('reservation_submit_invalid');
            return;
        }

        if (!checkIn || !checkOut) {
            showFormStatus('error', 'Unable to validate dates. Please refresh and try again.');
            trackEvent('reservation_submit_error', { reason: 'missing_date_fields' });
            return;
        }

        const nights = calculateNights(checkIn.value, checkOut.value);
        if (nights < 1) {
            showFormStatus('error', 'Check-out must be at least one day after check-in.');
            checkOut.focus();
            trackEvent('reservation_submit_error', { reason: 'invalid_nights' });
            return;
        }

        const selectedCabin = cabinSelect?.value || '';
        const nightlyRate = selectedCabin ? cabinRates[selectedCabin] || 0 : 0;
        const subtotal = nights * nightlyRate;

        showFormStatus('success', 'Availability request sent. Our reservation team will contact you within one business day.');
        trackEvent('reservation_submit_success', {
            cabin: selectedCabin,
            guests: guests?.value || '',
            nights,
            subtotal,
        });

        bookingForm.reset();
        if (cabinSelect && selectedCabinFromUrl) {
            cabinSelect.value = selectedCabinFromUrl;
        }

        applyMinimumDates();
        updateEstimate();
    });
};

initAnalyticsClicks();
initFloatingCta();
initTestimonialCarousel();
initCabinFilters();
initFaqSearch();
initReservationForm();
