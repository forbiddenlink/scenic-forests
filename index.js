// Import GSAP from node_modules
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

// Register ScrollTrigger plugin
gsap.registerPlugin(ScrollTrigger);

// DOM Elements
const menuBtn = document.getElementById('menu-btn');
const nav = document.getElementById('nav');
const exitBtn = document.getElementById('exit-btn');

// Mobile Navigation
const toggleNav = () => nav.classList.toggle('open-nav');

menuBtn?.addEventListener('click', toggleNav);
exitBtn?.addEventListener('click', toggleNav);

// Close mobile nav when clicking outside
document.addEventListener('click', (e) => {
    if (nav?.classList.contains('open-nav') && 
        !nav.contains(e.target) && 
        !menuBtn?.contains(e.target)) {
        toggleNav();
    }
});

// Hero Animations
if (document.querySelector('.main-copy')) {
    const heroTimeline = gsap.timeline({ defaults: { duration: 1, ease: 'power3.out' }});

    heroTimeline
        .from('.main-copy', { 
            y: 50, 
            opacity: 0 
        })
        .to('h1 span', {
            clipPath: 'polygon(0% 100%, 100% 100%, 100% 0%, 0% 0%)',
            stagger: 0.2
        }, '-=0.7')
        .from('.featured-cabins li', {
            y: 50,
            opacity: 0,
            stagger: 0.3
        }, '-=0.7');
}

// Scroll Animations
if (document.querySelector('.features')) {
    gsap.from('.features li', {
        scrollTrigger: {
            trigger: '.features',
            start: 'top 80%',
        },
        y: 50,
        opacity: 0,
        duration: 0.8,
        stagger: 0.2
    });
}

if (document.querySelector('.testimonials')) {
    gsap.from('.testimonials li', {
        scrollTrigger: {
            trigger: '.testimonials',
            start: 'top 80%',
        },
        x: -50,
        opacity: 0,
        duration: 0.8,
        stagger: 0.2
    });
}

// Reservation Form Handling
const bookingForm = document.getElementById('bookingForm');
if (bookingForm) {
    // Get cabin selection from URL if present
    const urlParams = new URLSearchParams(window.location.search);
    const selectedCabin = urlParams.get('cabin');
    
    if (selectedCabin) {
        const cabinSelect = document.getElementById('cabin');
        if (cabinSelect) {
            cabinSelect.value = selectedCabin;
        }
    }

    // Set minimum dates for check-in and check-out
    const checkIn = document.getElementById('checkIn');
    const checkOut = document.getElementById('checkOut');
    
    if (checkIn && checkOut) {
        // Set minimum date to today
        const today = new Date().toISOString().split('T')[0];
        checkIn.min = today;
        
        // Update check-out minimum date when check-in changes
        checkIn.addEventListener('change', (e) => {
            const selectedDate = new Date(e.target.value);
            selectedDate.setDate(selectedDate.getDate() + 1);
            checkOut.min = selectedDate.toISOString().split('T')[0];
            
            // If check-out date is before new minimum, update it
            if (checkOut.value && new Date(checkOut.value) <= new Date(e.target.value)) {
                checkOut.value = selectedDate.toISOString().split('T')[0];
            }
        });
    }

    // Form submission
    bookingForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        // Here you would typically send the form data to a server
        // For now, we'll just show an alert
        alert('Thank you for your reservation request! We will contact you shortly to confirm your booking.');
    });
}

// Smooth scroll for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', (e) => {
        const href = anchor.getAttribute('href');
        if (href !== '#') {
            e.preventDefault();
            const target = document.querySelector(href);
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        }
    });
});