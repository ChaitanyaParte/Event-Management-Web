const API_BASE = 'http://localhost:5000/api';

const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
};

const formatTime = (timeString) => {
  if (!timeString) return '';
  const [hours, minutes] = timeString.split(':');
  const date = new Date();
  date.setHours(Number(hours), Number(minutes));
  return date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
};

const hasActiveSession = () => ['student', 'organizer', 'admin']
  .some((role) => localStorage.getItem(`campusx_token_${role}`));

const createEventCard = (event) => {
  const detailsUrl = hasActiveSession() ? `event-details.html?id=${event.event_id}` : 'login.html';
  const card = document.createElement('article');
  card.className = 'card event-card';
  card.innerHTML = `
    <img src="assets/event-placeholder.svg" alt="" />
    <div class="event-card-content">
      <div class="event-badges">
        <span class="badge">${event.category_name}</span>
        <span class="badge">${event.status}</span>
        <span class="badge">Seats left: ${event.available_seats}</span>
      </div>
      <h3 class="event-card-title">${event.title}</h3>
      <p class="card-meta">${formatDate(event.event_date)} • ${formatTime(event.start_time)} - ${formatTime(event.end_time)} • ${event.venue}</p>
      <p class="section-subtitle">${event.description ? event.description.substring(0, 120) + '...' : 'No description available.'}</p>
      <a class="btn" href="${detailsUrl}">View Details</a>
    </div>
  `;
  return card;
};

const loadHomepage = async () => {
  const heroForm = document.getElementById('hero-search-form');
  const eventsContainer = document.getElementById('upcoming-events');
  const categoriesContainer = document.getElementById('category-list');
  const statsGrid = document.getElementById('home-stats');

  const renderEvents = (events) => {
    eventsContainer.innerHTML = '';
    if (!events.length) {
      eventsContainer.innerHTML = '<p>No upcoming events found.</p>';
      return;
    }
    events.slice(0, 6).forEach((event) => eventsContainer.appendChild(createEventCard(event)));
  };

  const renderCategories = (categories) => {
    categoriesContainer.innerHTML = categories.map((category) => `<div class="card"><h4>${category.category_name}</h4><p class="form-note">${category.description || 'No description'}.</p></div>`).join('');
  };

  const renderStats = (stats) => {
    statsGrid.innerHTML = `
      <div class="card stat-card"><span>${stats.total_events}</span><p>Total Events</p></div>
      <div class="card stat-card"><span>${stats.total_students}</span><p>Registered Students</p></div>
      <div class="card stat-card"><span>${stats.total_organizers}</span><p>Organizers</p></div>
      <div class="card stat-card"><span>${stats.completed_events}</span><p>Completed Events</p></div>
    `;
  };

  const fetchData = async () => {
    try {
      const [eventsRes, categoriesRes, statsRes] = await Promise.all([
        fetch(`${API_BASE}/events`),
        fetch(`${API_BASE}/categories`),
        fetch(`${API_BASE}/events/summary`),
      ]);
      const events = await eventsRes.json();
      const categories = await categoriesRes.json();
      const stats = await statsRes.json();
      renderEvents(events.filter((event) => event.status === 'Upcoming' || event.status === 'Ongoing'));
      renderCategories(categories);
      renderStats(stats);
    } catch (error) {
      eventsContainer.innerHTML = '<p>Unable to load events at this time.</p>';
      console.error(error);
    }
  };

  heroForm?.addEventListener('submit', (event) => {
    event.preventDefault();
    const formData = new FormData(heroForm);
    const query = new URLSearchParams({
      category: formData.get('eventType') || '',
      venue: formData.get('venue') || '',
      date: formData.get('date') || '',
      search: formData.get('search') || '',
    });
    window.location.href = `events.html?${query.toString()}`;
  });

  fetchData();
};

const loadEventsPage = async () => {
  const eventsContainer = document.getElementById('events-list');
  const categoriesDropdown = document.getElementById('category-filter');
  const venueInput = document.getElementById('venue-filter');
  const dateInput = document.getElementById('date-filter');
  const searchInput = document.getElementById('search-input');

  const queryParams = new URLSearchParams(window.location.search);
  const selectedCategory = queryParams.get('category') || '';
  const selectedVenue = queryParams.get('venue') || '';
  const selectedDate = queryParams.get('date') || '';
  const searchTerm = queryParams.get('search') || '';

  categoriesDropdown.value = selectedCategory;
  venueInput.value = selectedVenue;
  dateInput.value = selectedDate;
  searchInput.value = searchTerm;

  const renderEvents = (events) => {
    eventsContainer.innerHTML = '';
    if (!events.length) {
      eventsContainer.innerHTML = '<p>No events match your filters.</p>';
      return;
    }
    events.forEach((event) => eventsContainer.appendChild(createEventCard(event)));
  };

  const fetchCategories = async () => {
    try {
      const res = await fetch(`${API_BASE}/categories`);
      const categories = await res.json();
      categoriesDropdown.innerHTML = '<option value="">All Categories</option>' + categories.map((category) => `<option value="${category.category_name}">${category.category_name}</option>`).join('');
      if (selectedCategory) categoriesDropdown.value = selectedCategory;
    } catch (error) {
      console.error(error);
    }
  };

  const fetchEvents = async () => {
    try {
      const res = await fetch(`${API_BASE}/events`);
      let events = await res.json();
      if (selectedCategory) {
        events = events.filter((event) => event.category_name === selectedCategory);
      }
      if (selectedVenue) {
        events = events.filter((event) => event.venue.toLowerCase().includes(selectedVenue.toLowerCase()));
      }
      if (selectedDate) {
        events = events.filter((event) => event.event_date === selectedDate);
      }
      if (searchTerm) {
        events = events.filter((event) => event.title.toLowerCase().includes(searchTerm.toLowerCase()));
      }
      renderEvents(events);
    } catch (error) {
      eventsContainer.innerHTML = '<p>Unable to load events.</p>';
      console.error(error);
    }
  };

  document.getElementById('event-filter-form')?.addEventListener('submit', (event) => {
    event.preventDefault();
    const query = new URLSearchParams({
      category: categoriesDropdown.value,
      venue: venueInput.value,
      date: dateInput.value,
      search: searchInput.value,
    });
    window.location.search = query.toString();
  });

  await fetchCategories();
  await fetchEvents();
};

const setupRegisterAction = async (event) => {
  const container = document.getElementById('register-action');
  if (!container) return;

  const token = localStorage.getItem('campusx_token_student');
  const note = (text) => {
    container.innerHTML = `<p class="form-note">${text}</p>`;
  };

  if (token) {
    try {
      const studentId = JSON.parse(atob(token.split('.')[1])).id;
      const response = await fetch(`${API_BASE}/registrations/student/${studentId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const registrations = await response.json();
        if (registrations.some((r) => r.event_id === event.event_id && r.status === 'Registered')) {
          container.innerHTML = '<p class="form-note">You are already registered for this event. <a href="student/my-events.html">View my events</a></p>';
          return;
        }
      }
    } catch (error) {
      console.error(error);
    }
  }

  if (event.status === 'Cancelled' || event.status === 'Completed') {
    note(`Registration is closed because this event is ${event.status.toLowerCase()}.`);
    return;
  }
  if (Number(event.available_seats) <= 0) {
    note('This event is full. No seats are left.');
    return;
  }
  if (!token) {
    container.innerHTML = '<a class="btn" href="login.html">Login as a Student to Register</a>';
    return;
  }

  container.innerHTML = '<button class="btn" type="button" id="register-event-btn">Register for this Event</button><p class="form-note" id="register-message"></p>';
  const button = document.getElementById('register-event-btn');
  const message = document.getElementById('register-message');

  button.addEventListener('click', async () => {
    button.disabled = true;
    button.textContent = 'Registering...';
    message.textContent = '';

    try {
      const studentId = JSON.parse(atob(token.split('.')[1])).id;
      const response = await fetch(`${API_BASE}/registrations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ student_id: studentId, event_id: event.event_id }),
      });
      const result = await response.json();

      if (response.status === 401) {
        localStorage.removeItem('campusx_token_student');
        location.href = 'login.html';
        return;
      }
      if (!response.ok) {
        message.textContent = result.message || 'Registration failed.';
        button.disabled = false;
        button.textContent = 'Register for this Event';
        return;
      }

      button.textContent = 'Registered';
      message.innerHTML = 'You are registered! <a href="student/my-events.html">View my events</a>';
    } catch (error) {
      console.error(error);
      message.textContent = 'Registration failed. Please try again.';
      button.disabled = false;
      button.textContent = 'Register for this Event';
    }
  });
};

const loadEventDetails = async () => {
  if (!hasActiveSession()) {
    location.href = 'login.html';
    return;
  }

  const params = new URLSearchParams(window.location.search);
  const eventId = params.get('id');
  const detailContainer = document.getElementById('event-detail');

  if (!eventId) {
    detailContainer.innerHTML = '<p>Event ID is required.</p>';
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/events/${eventId}`);
    if (!res.ok) {
      detailContainer.innerHTML = '<p>Event not found.</p>';
      return;
    }
    const event = await res.json();
    detailContainer.innerHTML = `
      <div class="card">
        <h2>${event.title}</h2>
        <div class="event-badges">
          <span class="badge">${event.category_name}</span>
          <span class="badge">${event.status}</span>
          <span class="badge">Seats left: ${event.available_seats}</span>
        </div>
        <p class="card-meta">${formatDate(event.event_date)} • ${formatTime(event.start_time)} - ${formatTime(event.end_time)} • ${event.venue}</p>
        <p>${event.description || 'No description available.'}</p>
        <p><strong>Organizer:</strong> ${event.organizer_name}</p>
        <p><strong>Created by:</strong> ${event.created_by_name}</p>
        <div id="register-action" style="margin-top: 1.5rem;"></div>
      </div>
    `;
    setupRegisterAction(event);
  } catch (error) {
    detailContainer.innerHTML = '<p>Unable to load event details.</p>';
    console.error(error);
  }
};

const loadLoginPage = () => {
  const form = document.querySelector('[data-login-form]');
  const roleInput = document.getElementById('login-role');
  const title = document.getElementById('login-form-title');
  const submitButton = document.getElementById('login-submit-btn');
  const roleButtons = document.querySelectorAll('.login-role-option');

  const setRole = (role) => {
    const selectedRole = ['student', 'organizer', 'admin'].includes(role) ? role : 'student';
    roleInput.value = selectedRole;
    const titles = { student: 'Student Login', organizer: 'Organizer Login', admin: 'Admin Login' };
    title.textContent = titles[selectedRole];

    roleButtons.forEach((button) => {
      const isActive = button.dataset.role === selectedRole;
      button.classList.toggle('is-active', isActive);
      button.setAttribute('aria-pressed', String(isActive));
    });
  };

  roleButtons.forEach((button) => {
    button.addEventListener('click', () => setRole(button.dataset.role));
  });

  form?.addEventListener('submit', async (event) => {
    event.preventDefault();

    const formData = new FormData(form);
    const role = formData.get('role');
    const email = formData.get('email');
    const password = formData.get('password');

    if (!role || !email || !password) {
      alert('Please fill in all fields.');
      return;
    }

    submitButton.disabled = true;
    submitButton.textContent = 'Logging in...';

    try {
      const response = await fetch(`${API_BASE}/auth/${role}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const result = await response.json();

      if (!response.ok) {
        alert(result.message || 'Login failed');
        return;
      }

      localStorage.setItem(`campusx_token_${role}`, result.token);
      alert('Login successful. Redirecting to dashboard.');

      if (role === 'student') location.href = 'student/student-dashboard.html';
      else if (role === 'organizer') location.href = 'organizer/organizer-dashboard.html';
      else if (role === 'admin') location.href = 'admin/admin-dashboard.html';
    } catch (error) {
      alert('Login failed. Check the console for details.');
      console.error(error);
    } finally {
      submitButton.disabled = false;
      submitButton.textContent = 'Login';
    }
  });

  setRole('student');
};

const loadRegisterPage = () => {
  const form = document.querySelector('[data-register-form]');
  const roleInput = document.getElementById('register-role');
  const title = document.getElementById('register-form-title');
  const submitButton = document.getElementById('register-submit-btn');
  const roleButtons = document.querySelectorAll('.login-role-option');
  const studentFields = document.getElementById('student-fields');
  const adminFields = document.getElementById('admin-fields');
  const extraFields = document.getElementById('extra-fields');
  const rollNumberInput = document.querySelector('input[name="roll_number"]');
  const yearInput = document.querySelector('select[name="year_of_study"]');
  const usernameInput = document.querySelector('input[name="username"]');
  const departmentInput = document.querySelector('input[name="department"]');

  const setRole = (role) => {
    const selectedRole = ['student', 'organizer', 'admin'].includes(role) ? role : 'student';
    roleInput.value = selectedRole;

    const titles = {
      student: 'Student Registration',
      organizer: 'Organizer Registration',
      admin: 'Admin Registration'
    };
    title.textContent = titles[selectedRole];

    roleButtons.forEach((button) => {
      const isActive = button.dataset.role === selectedRole;
      button.classList.toggle('is-active', isActive);
      button.setAttribute('aria-pressed', String(isActive));
    });

    if (studentFields) {
      studentFields.style.display = selectedRole === 'student' ? 'block' : 'none';
      if (rollNumberInput) rollNumberInput.required = selectedRole === 'student';
      if (yearInput) yearInput.required = selectedRole === 'student';
    }
    if (adminFields) {
      adminFields.style.display = selectedRole === 'admin' ? 'block' : 'none';
      if (usernameInput) usernameInput.required = selectedRole === 'admin';
    }
    if (extraFields) {
      extraFields.style.display = selectedRole === 'admin' ? 'none' : 'block';
      if (departmentInput) departmentInput.required = selectedRole !== 'admin';
    }
  };

  roleButtons.forEach((button) => {
    button.addEventListener('click', () => setRole(button.dataset.role));
  });

  form?.addEventListener('submit', async (event) => {
    event.preventDefault();

    const formData = new FormData(form);
    const role = formData.get('role');

    let payload, endpoint, redirectUrl;

    if (role === 'student') {
      payload = {
        roll_number: formData.get('roll_number'),
        full_name: formData.get('full_name'),
        email: formData.get('email'),
        password: formData.get('password'),
        phone: formData.get('phone'),
        department: formData.get('department'),
        year_of_study: formData.get('year_of_study'),
      };
      endpoint = `${API_BASE}/auth/student/register`;
      redirectUrl = 'student/student-dashboard.html';
    } else if (role === 'organizer') {
      payload = {
        full_name: formData.get('full_name'),
        email: formData.get('email'),
        password: formData.get('password'),
        phone: formData.get('phone'),
        department: formData.get('department'),
      };
      endpoint = `${API_BASE}/auth/organizer/register`;
      redirectUrl = 'organizer/organizer-dashboard.html';
    } else if (role === 'admin') {
      payload = {
        username: formData.get('username'),
        full_name: formData.get('full_name'),
        email: formData.get('email'),
        password: formData.get('password'),
      };
      endpoint = `${API_BASE}/auth/admin/register`;
      redirectUrl = 'admin/admin-dashboard.html';
    }

    submitButton.disabled = true;
    submitButton.textContent = 'Creating account...';

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (!response.ok) {
        alert(result.message || 'Registration failed');
        return;
      }
      if (!result.token) {
        alert(result.message || 'Registration received. Please wait for admin approval.');
        location.href = 'login.html';
        return;
      }
      localStorage.setItem(`campusx_token_${role}`, result.token);
      alert('Registration successful. Redirecting to dashboard.');
      location.href = redirectUrl;
    } catch (error) {
      alert('Registration failed. Check the console for details.');
      console.error(error);
    } finally {
      submitButton.disabled = false;
      submitButton.textContent = 'Create Account';
    }
  });

  setRole('student');
};

const setupAuthNav = () => {
  const loginLink = document.querySelector('.nav-links a[href="login.html"]');
  const registerLink = document.querySelector('.nav-links a[href="register.html"]');
  const reference = loginLink || registerLink;
  if (!reference) return;

  const dashboards = [
    { role: 'student', label: 'Student', url: 'student/student-dashboard.html' },
    { role: 'organizer', label: 'Organizer', url: 'organizer/organizer-dashboard.html' },
    { role: 'admin', label: 'Admin', url: 'admin/admin-dashboard.html' },
  ].filter(({ role }) => localStorage.getItem(`campusx_token_${role}`));
  if (dashboards.length === 0) return;

  dashboards.forEach(({ label, url }) => {
    const link = document.createElement('a');
    link.className = 'btn';
    link.href = url;
    link.textContent = dashboards.length === 1 ? 'Go to Dashboard' : `${label} Dashboard`;
    reference.before(link);
  });
  loginLink?.remove();
  registerLink?.remove();
};

const initPage = () => {
  setupAuthNav();
  const page = document.documentElement.dataset.page;
  if (page === 'home') {
    loadHomepage();
  } else if (page === 'events') {
    loadEventsPage();
  } else if (page === 'event-details') {
    loadEventDetails();
  } else if (page === 'login') {
    loadLoginPage();
  } else if (page === 'register') {
    loadRegisterPage();
  }
};

window.addEventListener('DOMContentLoaded', initPage);
