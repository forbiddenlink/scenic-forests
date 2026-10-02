import {
  addDays,
  CABINS,
  formatDate,
  guestOptionsFor,
  MIN_NIGHTS,
  nightsBetween,
  priceQuote,
  resolveCabinParam,
  todayLocal,
  validateBooking,
} from './booking.js'

const menuBtn = document.getElementById('menu-btn')
const primaryNav = document.getElementById('primary-nav')
const navLinks = primaryNav ? Array.from(primaryNav.querySelectorAll('a')) : []
const isDesktop = () => window.matchMedia('(min-width: 980px)').matches

const ANALYTICS_STORAGE_KEY = 'scenic_analytics_events'

const trackEvent = (name, payload = {}) => {
  const event = {
    name,
    payload,
    path: window.location.pathname,
    timestamp: new Date().toISOString(),
  }

  window.dataLayer = window.dataLayer || []
  window.dataLayer.push({ event: name, ...payload })

  try {
    const stored = JSON.parse(localStorage.getItem(ANALYTICS_STORAGE_KEY) || '[]')
    stored.unshift(event)
    localStorage.setItem(ANALYTICS_STORAGE_KEY, JSON.stringify(stored.slice(0, 60)))
  } catch {
    // Ignore storage failures (private mode, quota, etc.)
  }

  if (typeof window.SCENIC_ANALYTICS_ENDPOINT === 'string' && navigator.sendBeacon) {
    const blob = new Blob([JSON.stringify(event)], { type: 'application/json' })
    navigator.sendBeacon(window.SCENIC_ANALYTICS_ENDPOINT, blob)
  }
}

const setNavState = (isOpen) => {
  if (!menuBtn || !primaryNav) return

  const open = isDesktop() ? false : isOpen
  menuBtn.setAttribute('aria-expanded', String(open))
  primaryNav.classList.toggle('is-open', open)
  document.body.classList.toggle('nav-open', open)
  document.body.classList.toggle('no-scroll', open)
}

if (menuBtn && primaryNav) {
  setNavState(false)

  menuBtn.addEventListener('click', () => {
    const shouldOpen = menuBtn.getAttribute('aria-expanded') !== 'true'
    setNavState(shouldOpen)
    trackEvent('menu_toggle', { open: shouldOpen })
  })

  navLinks.forEach((link) => {
    link.addEventListener('click', () => {
      if (!isDesktop()) {
        setNavState(false)
      }
    })
  })

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      setNavState(false)
    }
  })

  document.addEventListener('click', (event) => {
    if (isDesktop()) return

    const clickTarget = event.target
    const navIsOpen = menuBtn.getAttribute('aria-expanded') === 'true'
    if (!navIsOpen) return

    if (!primaryNav.contains(clickTarget) && !menuBtn.contains(clickTarget)) {
      setNavState(false)
    }
  })

  window.addEventListener('resize', () => {
    if (isDesktop()) {
      setNavState(false)
    }
  })
}

const initAnalyticsClicks = () => {
  document.addEventListener('click', (event) => {
    const interactive = event.target.closest('a, button')
    if (!interactive) return

    const trackedClassNames = [
      'nav-cta',
      'btn-primary',
      'btn-secondary',
      'card-link',
      'inline-btn',
      'floating-cta-link',
      'carousel-btn',
      'dot',
    ]

    const shouldTrack = trackedClassNames.some((className) =>
      interactive.classList.contains(className)
    )
    if (!shouldTrack) return

    const label = (interactive.textContent || '').trim().slice(0, 80)
    const href = interactive.getAttribute('href') || ''

    trackEvent('ui_click', {
      label,
      href,
      classes: interactive.className,
    })
  })
}

const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
const prefersReducedMotion = reducedMotionQuery.matches
const revealEls = document.querySelectorAll('.reveal')

if (revealEls.length > 0) {
  if (prefersReducedMotion || !('IntersectionObserver' in window)) {
    revealEls.forEach((el) => {
      el.classList.add('revealed')
    })
  } else {
    const revealObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return
          entry.target.classList.add('revealed')
          observer.unobserve(entry.target)
        })
      },
      {
        rootMargin: '0px 0px -8% 0px',
        threshold: 0.15,
      }
    )

    revealEls.forEach((el) => {
      revealObserver.observe(el)
    })
  }
}

const currencyFormat = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
})

const initFloatingCta = () => {
  const isReservationsPath =
    window.location.pathname.endsWith('/reservations.html') ||
    window.location.pathname.endsWith('/reservations')
  if (isReservationsPath) return

  const storageKey = 'scenic_floating_cta_dismissed_v1'

  let floatingCta = document.getElementById('floatingCta')
  if (!floatingCta) {
    floatingCta = document.createElement('aside')
    floatingCta.id = 'floatingCta'
    floatingCta.className = 'floating-cta'
    floatingCta.hidden = true
    floatingCta.setAttribute('aria-label', 'Quick reservation call to action')
    floatingCta.innerHTML = `
            <p>Planning a stay? Try the booking preview.</p>
            <a href="reservations.html" class="btn btn-primary floating-cta-link">Preview a booking</a>
            <button type="button" class="floating-close" id="floatingCtaClose" aria-label="Dismiss booking prompt">Dismiss</button>
        `
    document.body.append(floatingCta)
  }

  let dismissed = false
  try {
    dismissed = localStorage.getItem(storageKey) === '1'
  } catch {
    dismissed = false
  }

  if (dismissed) return

  const closeBtn = floatingCta.querySelector('#floatingCtaClose')
  const ctaLink = floatingCta.querySelector('.floating-cta-link')

  floatingCta.hidden = false
  document.body.classList.add('has-floating-cta')

  closeBtn?.addEventListener('click', () => {
    floatingCta.hidden = true
    document.body.classList.remove('has-floating-cta')
    try {
      localStorage.setItem(storageKey, '1')
    } catch {
      // Ignore storage failures.
    }
    trackEvent('floating_cta_dismissed')
  })

  ctaLink?.addEventListener('click', () => {
    trackEvent('floating_cta_clicked')
  })
}

const initTestimonialCarousel = () => {
  const carousel = document.getElementById('testimonialCarousel')
  if (!carousel) return

  const slides = Array.from(carousel.querySelectorAll('[data-slide]'))
  const dots = Array.from(carousel.querySelectorAll('.dot'))
  const prevBtn = document.getElementById('carouselPrev')
  const nextBtn = document.getElementById('carouselNext')

  if (slides.length < 2) return

  let activeIndex = 0
  let intervalId = null

  const setActive = (nextIndex, userAction = false) => {
    activeIndex = (nextIndex + slides.length) % slides.length

    slides.forEach((slide, index) => {
      slide.classList.toggle('is-active', index === activeIndex)
    })

    dots.forEach((dot, index) => {
      dot.classList.toggle('is-active', index === activeIndex)
    })

    if (userAction) {
      trackEvent('testimonial_slide_change', { index: activeIndex + 1 })
    }
  }

  const stopAutoPlay = () => {
    if (intervalId) {
      clearInterval(intervalId)
      intervalId = null
    }
  }

  const startAutoPlay = () => {
    stopAutoPlay()
    if (prefersReducedMotion) return

    intervalId = window.setInterval(() => {
      setActive(activeIndex + 1)
    }, 5500)
  }

  prevBtn?.addEventListener('click', () => {
    setActive(activeIndex - 1, true)
  })

  nextBtn?.addEventListener('click', () => {
    setActive(activeIndex + 1, true)
  })

  dots.forEach((dot) => {
    dot.addEventListener('click', () => {
      const index = Number(dot.dataset.index || 0)
      setActive(index, true)
    })
  })

  carousel.addEventListener('mouseenter', stopAutoPlay)
  carousel.addEventListener('mouseleave', startAutoPlay)
  carousel.addEventListener('focusin', stopAutoPlay)
  carousel.addEventListener('focusout', startAutoPlay)

  setActive(0)
  startAutoPlay()
}

const initCabinFilters = () => {
  const cabinsGrid = document.querySelector('.cabin-grid')
  const cabinCards = cabinsGrid ? Array.from(cabinsGrid.querySelectorAll('[data-cabin]')) : []

  if (!cabinsGrid || cabinCards.length === 0) return

  const filterGuests = document.getElementById('filterGuests')
  const filterPrice = document.getElementById('filterPrice')
  const filterPets = document.getElementById('filterPets')
  const sortCabins = document.getElementById('sortCabins')
  const clearFilters = document.getElementById('clearFilters')
  const resultsCount = document.getElementById('resultsCount')
  const emptyResults = document.getElementById('emptyResults')

  if (
    !filterGuests ||
    !filterPrice ||
    !filterPets ||
    !sortCabins ||
    !clearFilters ||
    !resultsCount ||
    !emptyResults
  ) {
    return
  }

  const records = cabinCards.map((card, featuredIndex) => {
    const listItem = card.closest('li')
    return {
      card,
      listItem,
      featuredIndex,
      price: Number(card.dataset.price || 0),
      sleeps: Number(card.dataset.sleeps || 0),
      petFriendly: card.dataset.petFriendly === 'yes',
      name: (card.dataset.name || '').toLowerCase(),
      matches: true,
    }
  })

  const applyFiltersAndSort = (emitEvent = false) => {
    const minGuests = Number(filterGuests.value || 0)
    const maxPrice = Number(filterPrice.value || 0)
    const petsOnly = filterPets.value === 'yes'
    const sortValue = sortCabins.value

    records.forEach((record) => {
      const passesGuests = minGuests ? record.sleeps >= minGuests : true
      const passesPrice = maxPrice ? record.price <= maxPrice : true
      const passesPets = petsOnly ? record.petFriendly : true

      record.matches = passesGuests && passesPrice && passesPets
      if (record.listItem) {
        record.listItem.hidden = !record.matches
      }
    })

    const visible = records.filter((record) => record.matches)

    visible.sort((a, b) => {
      if (sortValue === 'price-asc') return a.price - b.price
      if (sortValue === 'price-desc') return b.price - a.price
      if (sortValue === 'name-asc') return a.name.localeCompare(b.name)
      return a.featuredIndex - b.featuredIndex
    })

    const hidden = records.filter((record) => !record.matches)
    const nextOrder = [...visible, ...hidden]

    nextOrder.forEach((record) => {
      if (record.listItem) {
        cabinsGrid.append(record.listItem)
      }
    })

    const label = visible.length === 1 ? 'cabin' : 'cabins'
    resultsCount.textContent = `Showing ${visible.length} ${label}`
    emptyResults.hidden = visible.length !== 0

    if (emitEvent) {
      trackEvent('cabin_filters_changed', {
        minGuests,
        maxPrice,
        petsOnly,
        sortValue,
        resultCount: visible.length,
      })
    }
  }

  ;[filterGuests, filterPrice, filterPets, sortCabins].forEach((element) => {
    element.addEventListener('change', () => applyFiltersAndSort(true))
  })

  clearFilters.addEventListener('click', () => {
    filterGuests.value = ''
    filterPrice.value = ''
    filterPets.value = ''
    sortCabins.value = 'featured'
    applyFiltersAndSort(true)
  })

  applyFiltersAndSort()
}

const initFaqSearch = () => {
  const searchInput = document.getElementById('faqSearch')
  const resultCount = document.getElementById('faqSearchCount')
  const emptyState = document.getElementById('faqEmptyState')
  const faqItems = Array.from(document.querySelectorAll('[data-faq-item]'))

  if (!searchInput || !resultCount || !emptyState || faqItems.length === 0) return

  let timer = null

  const applyFaqSearch = (emitEvent = false) => {
    const query = searchInput.value.trim().toLowerCase()
    let visibleCount = 0

    faqItems.forEach((item) => {
      const summary = item.querySelector('summary')?.textContent || ''
      const detail = item.querySelector('p')?.textContent || ''
      const text = `${summary} ${detail}`.toLowerCase()
      const matches = query.length === 0 ? true : text.includes(query)
      item.hidden = !matches
      if (matches) visibleCount += 1
    })

    const label = visibleCount === 1 ? 'question' : 'questions'
    resultCount.textContent = `Showing ${visibleCount} ${label}`
    emptyState.hidden = visibleCount !== 0

    if (emitEvent) {
      trackEvent('faq_search', { queryLength: query.length, resultCount: visibleCount })
    }
  }

  searchInput.addEventListener('input', () => {
    applyFaqSearch()
    if (timer) {
      clearTimeout(timer)
    }
    timer = window.setTimeout(() => {
      applyFaqSearch(true)
    }, 450)
  })

  applyFaqSearch()
}

const initReservationForm = () => {
  const bookingForm = document.getElementById('bookingForm')
  if (!bookingForm) return

  const formStatus = document.getElementById('formStatus')
  const confirmation = document.getElementById('bookingConfirmation')
  const confirmationHeading = document.getElementById('confirmationHeading')
  const confirmationList = document.getElementById('confirmationList')
  const startOver = document.getElementById('startOver')

  const cabinSelect = document.getElementById('cabin')
  const checkIn = document.getElementById('checkIn')
  const checkOut = document.getElementById('checkOut')
  const guests = document.getElementById('guests')

  const field = (id) => document.getElementById(id)
  const setText = (id, text) => {
    const el = field(id)
    if (el) el.textContent = text
  }

  const fieldIds = [
    'firstName',
    'lastName',
    'email',
    'phone',
    'cabin',
    'checkIn',
    'checkOut',
    'guests',
  ]

  const showFormStatus = (type, message) => {
    if (!formStatus) return
    formStatus.textContent = message
    formStatus.classList.add('is-visible')
    formStatus.classList.toggle('is-error', type === 'error')
    formStatus.classList.toggle('is-success', type === 'success')
  }

  const clearFormStatus = () => {
    if (!formStatus) return
    formStatus.textContent = ''
    formStatus.classList.remove('is-visible', 'is-error', 'is-success')
  }

  const errorEl = (id) => {
    let el = document.getElementById(`${id}-error`)
    const input = field(id)
    if (!el && input) {
      el = document.createElement('span')
      el.className = 'field-error'
      el.id = `${id}-error`
      el.hidden = true
      input.closest('.form-field')?.append(el)
    }
    return el
  }

  const setFieldError = (id, message) => {
    const input = field(id)
    const el = errorEl(id)
    if (!input || !el) return
    el.textContent = message || ''
    el.hidden = !message
    if (message) {
      input.setAttribute('aria-invalid', 'true')
      input.setAttribute('aria-describedby', el.id)
    } else {
      input.removeAttribute('aria-invalid')
      input.removeAttribute('aria-describedby')
    }
  }

  const readValues = () => Object.fromEntries(fieldIds.map((id) => [id, field(id)?.value ?? '']))

  const rebuildGuestOptions = () => {
    if (!guests || !cabinSelect) return
    const previous = guests.value
    const options = guestOptionsFor(cabinSelect.value)
    guests.replaceChildren(new Option('Select guest count', ''))
    for (const count of options) {
      guests.append(new Option(`${count} ${count === 1 ? 'guest' : 'guests'}`, String(count)))
    }
    guests.value = previous && Number(previous) <= options.length ? previous : ''
  }

  const updateEstimate = () => {
    const slug = cabinSelect?.value || ''
    const nights = nightsBetween(checkIn?.value, checkOut?.value)
    const quote = priceQuote(slug, nights)
    const money = (n) => currencyFormat.format(n)
    const hasQuote = quote.total > 0

    setText('summaryCabin', CABINS[slug]?.name ?? 'Not selected')
    setText(
      'summaryDates',
      nights > 0
        ? `${formatDate(checkIn.value)} - ${formatDate(checkOut.value)}`
        : 'Choose check-in and check-out'
    )
    const guestCount = guests?.value ? Number(guests.value) : 0
    setText(
      'summaryGuests',
      guestCount ? `${guestCount} ${guestCount === 1 ? 'guest' : 'guests'}` : 'Choose guest count'
    )
    setText('summaryNights', `${nights} ${nights === 1 ? 'night' : 'nights'}`)
    setText('summarySubtotal', hasQuote ? money(quote.subtotal) : '$0')
    setText('summaryCleaning', hasQuote ? money(quote.cleaning) : '$0')
    setText('summaryTax', hasQuote ? money(quote.tax) : '$0')
    setText('summaryTotal', hasQuote ? money(quote.total) : '$0')
    setText('summaryDeposit', hasQuote ? money(quote.deposit) : '$0')
  }

  const applyMinimumDates = () => {
    if (!checkIn || !checkOut) return

    const today = todayLocal()
    checkIn.min = today

    const base = checkIn.value && checkIn.value >= today ? checkIn.value : today
    const minimumCheckOut = addDays(base, MIN_NIGHTS)
    checkOut.min = minimumCheckOut

    if (checkOut.value && checkOut.value < minimumCheckOut && checkIn.value) {
      checkOut.value = minimumCheckOut
    }
  }

  // Prefill from ?cabin=, but only for a cabin that exists.
  const cabinFromUrl = resolveCabinParam(new URLSearchParams(window.location.search).get('cabin'))
  if (cabinSelect && cabinFromUrl) cabinSelect.value = cabinFromUrl

  rebuildGuestOptions()
  applyMinimumDates()
  updateEstimate()

  cabinSelect?.addEventListener('change', rebuildGuestOptions)
  checkIn?.addEventListener('change', applyMinimumDates)
  for (const input of [cabinSelect, checkIn, checkOut, guests]) {
    input?.addEventListener('change', updateEstimate)
  }
  for (const id of fieldIds) {
    const input = field(id)
    const clear = () => setFieldError(id, '')
    input?.addEventListener('input', clear)
    input?.addEventListener('change', clear)
  }

  const row = (label, value, className) => {
    const wrap = document.createElement('div')
    if (className) wrap.className = className
    const dt = document.createElement('dt')
    dt.textContent = label
    const dd = document.createElement('dd')
    dd.textContent = value
    wrap.append(dt, dd)
    return wrap
  }

  const showConfirmation = (values, nights, quote) => {
    if (!confirmation || !confirmationList) return
    const money = (n) => currencyFormat.format(n)
    const cabin = CABINS[values.cabin]
    const guestCount = Number(values.guests)

    if (confirmationHeading) {
      confirmationHeading.textContent = `Demo preview for ${values.firstName.trim()}`
    }
    confirmationList.replaceChildren(
      row('Cabin', cabin.name),
      row('Check-in', formatDate(values.checkIn)),
      row('Check-out', formatDate(values.checkOut)),
      row('Guests', `${guestCount} ${guestCount === 1 ? 'guest' : 'guests'}`),
      row('Nights', String(nights)),
      row(`${money(quote.nightly)} x ${nights} nights`, money(quote.subtotal)),
      row('Cleaning fee (example)', money(quote.cleaning)),
      row('Taxes (example)', money(quote.tax)),
      row('Estimated total', money(quote.total), 'total-row'),
      row('50% deposit that would be due', money(quote.deposit))
    )
    bookingForm.hidden = true
    confirmation.hidden = false
    confirmationHeading?.focus()
    confirmation.scrollIntoView({ block: 'start' })
  }

  startOver?.addEventListener('click', () => {
    bookingForm.reset()
    if (cabinSelect && cabinFromUrl) cabinSelect.value = cabinFromUrl
    for (const id of fieldIds) setFieldError(id, '')
    clearFormStatus()
    rebuildGuestOptions()
    applyMinimumDates()
    updateEstimate()
    if (confirmation) confirmation.hidden = true
    bookingForm.hidden = false
    field('firstName')?.focus()
  })

  bookingForm.addEventListener('submit', (event) => {
    event.preventDefault()

    const values = readValues()
    const errors = validateBooking(values)
    for (const id of fieldIds) setFieldError(id, errors[id])

    const firstInvalid = fieldIds.find((id) => errors[id])
    if (firstInvalid) {
      const count = Object.keys(errors).length
      showFormStatus(
        'error',
        `Fix ${count} ${count === 1 ? 'field' : 'fields'} to preview your booking.`
      )
      field(firstInvalid)?.focus()
      trackEvent('reservation_submit_invalid', { fields: Object.keys(errors) })
      return
    }

    clearFormStatus()
    const nights = nightsBetween(values.checkIn, values.checkOut)
    const quote = priceQuote(values.cabin, nights)
    trackEvent('reservation_demo_preview', {
      cabin: values.cabin,
      guests: Number(values.guests),
      nights,
      total: quote.total,
    })
    showConfirmation(values, nights, quote)
  })
}

initAnalyticsClicks()
initFloatingCta()
initTestimonialCarousel()
initCabinFilters()
initFaqSearch()
initReservationForm()
