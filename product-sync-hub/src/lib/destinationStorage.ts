export interface DestinationDayTemplate {
  id: string;
  dayNumber: number;
  destinationCity: string;
  title: string;
  description: string;
  imageUrl?: string;
  activities?: string;
}

export interface DestinationItem {
  id: string;
  name: string;
  stateOrCountry?: string;
  coverImage?: string;
  description?: string;
  days: DestinationDayTemplate[];
  createdAt?: string;
  updatedAt?: string;
}

const STORAGE_KEY = "travel_destination_library_v1";

export const DEFAULT_DESTINATIONS: DestinationItem[] = [
  {
    id: "dest-kashmir",
    name: "Kashmir Paradise",
    stateOrCountry: "Jammu & Kashmir, India",
    coverImage: "https://images.unsplash.com/photo-1595815771614-ade9d652a65d?auto=format&fit=crop&q=80&w=1200",
    description: "Heaven on Earth - Srinagar, Gulmarg, Pahalgam, and Dal Lake",
    days: [
      {
        id: "kash-1",
        dayNumber: 1,
        destinationCity: "Srinagar",
        title: "Arrival in Srinagar & Romantic Dal Lake Shikara Ride",
        description: "Warm welcome at Srinagar Airport. Transfer to traditional Deluxe Houseboat or Hotel. In the late afternoon, enjoy a peaceful 1-hour Shikara ride across the serene Dal Lake, visiting floating gardens, Nehru Park, and Char Chinar against the backdrop of the Zabarwan mountain range.",
        imageUrl: "https://images.unsplash.com/photo-1595815771614-ade9d652a65d?auto=format&fit=crop&q=80&w=1200",
      },
      {
        id: "kash-2",
        dayNumber: 2,
        destinationCity: "Gulmarg",
        title: "Day Excursion to Meadow of Flowers – Gulmarg & Gondola Ride",
        description: "Full day scenic excursion to Gulmarg (2,730 m), famous for snow-capped peaks and the world's highest 18-hole golf course. Board the legendary Gulmarg Gondola (Phase 1 to Kongdoori & Phase 2 to Apharwat Peak) for breathtaking panoramic Himalayan views and snow activities.",
        imageUrl: "https://images.unsplash.com/photo-1589182373726-e4f658ab50f0?auto=format&fit=crop&q=80&w=1200",
      },
      {
        id: "kash-3",
        dayNumber: 3,
        destinationCity: "Pahalgam",
        title: "Scenic Transfer to Pahalgam & Betaab / Aru Valley Exploration",
        description: "Drive along the picturesque saffron fields of Pampore and pine-clad Awantipora ruins towards Pahalgam (Valley of Shepherds). Visit the enchanting Betaab Valley (famed Bollywood backdrop), serene Chandanwari, and emerald Aru Valley beside the Lidder River.",
        imageUrl: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&q=80&w=1200",
      },
      {
        id: "kash-4",
        dayNumber: 4,
        destinationCity: "Sonmarg",
        title: "Golden Meadow Sonmarg & Thajiwas Glacier Day Excursion",
        description: "Journey along the Sindh River to Sonmarg (Meadow of Gold). Marvel at dramatic alpine peaks, flower-carpeted meadows, and hire ponies to reach the majestic Thajiwas Glacier, blanketed in year-round snow.",
        imageUrl: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&q=80&w=1200",
      },
      {
        id: "kash-5",
        dayNumber: 5,
        destinationCity: "Srinagar Departure",
        title: "Mughal Gardens Tour & Airport Departure with Sweet Memories",
        description: "Morning visit to the iconic Nishat Bagh (Garden of Pleasure), Shalimar Bagh (Abode of Love), and historic Shankaracharya Temple. Later, transfer to Srinagar International Airport for your onward flight home with lifetime memories.",
        imageUrl: "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&q=80&w=1200",
      },
    ],
  },
  {
    id: "dest-ladakh",
    name: "Ladakh High Altitude Odyssey",
    stateOrCountry: "Ladakh, India",
    coverImage: "https://images.unsplash.com/photo-1581793745862-99fde7fa73d2?auto=format&fit=crop&q=80&w=1200",
    description: "Land of High Passes - Leh, Khardung La, Nubra Valley & Pangong Tso",
    days: [
      {
        id: "lad-1",
        dayNumber: 1,
        destinationCity: "Leh",
        title: "Arrival in Leh & Complete Rest for Acclimatization",
        description: "Fly into Kushok Bakula Rimpochee Airport Leh (3,500 m). Transfer to hotel. Mandatory complete rest for acclimatization to high altitude. Evening stroll around the vibrant Leh Main Bazaar and Shanti Stupa for sunset view.",
        imageUrl: "https://images.unsplash.com/photo-1581793745862-99fde7fa73d2?auto=format&fit=crop&q=80&w=1200",
      },
      {
        id: "lad-2",
        dayNumber: 2,
        destinationCity: "Sham Valley",
        title: "Sham Valley Excursion – Magnetic Hill, Sangam & Pathar Sahib",
        description: "Drive along the Indus River to witness the gravity-defying Magnetic Hill, sacred Gurudwara Pathar Sahib, the confluence of Zanskar and Indus rivers at Nimmu, and the Hall of Fame military museum.",
        imageUrl: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&q=80&w=1200",
      },
      {
        id: "lad-3",
        dayNumber: 3,
        destinationCity: "Nubra Valley",
        title: "Scenic Crossing over Khardung La (17,582 ft) to Hunder Sand Dunes",
        description: "Drive over the world's highest motorable pass, Khardung La. Descend into the picturesque Nubra Valley. Visit Diskit Monastery with its towering 106-ft Maitreya Buddha statue and enjoy a double-humped Bactrian camel ride across Hunder white sand dunes.",
        imageUrl: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&q=80&w=1200",
      },
      {
        id: "lad-4",
        dayNumber: 4,
        destinationCity: "Pangong Tso",
        title: "Nubra Valley to Azure Pangong Lake via Shyok River",
        description: "Drive alongside the rugged Shyok River to the world-famous Pangong Tso (14,270 ft), spanning India and Tibet. Be mesmerized by the deep blue lake that changes shades throughout the day. Overnight stay in luxury lakeside camps.",
        imageUrl: "https://images.unsplash.com/photo-1581793745862-99fde7fa73d2?auto=format&fit=crop&q=80&w=1200",
      },
      {
        id: "lad-5",
        dayNumber: 5,
        destinationCity: "Leh",
        title: "Pangong Tso Sunrise & Return to Leh via Chang La Pass",
        description: "Witness an unforgettable sunrise over Pangong Lake. Drive back to Leh crossing the high Chang La Pass (17,590 ft). En route visit the historic Thiksey Monastery and Shey Palace.",
        imageUrl: "https://images.unsplash.com/photo-1595815771614-ade9d652a65d?auto=format&fit=crop&q=80&w=1200",
      },
      {
        id: "lad-6",
        dayNumber: 6,
        destinationCity: "Leh Departure",
        title: "Departure from Leh Airport with Unforgettable Memories",
        description: "Early morning transfer to Leh Airport. Board your return flight with memories of the magical landscapes and monasteries of Ladakh.",
        imageUrl: "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&q=80&w=1200",
      },
    ],
  },
  {
    id: "dest-himachal",
    name: "Himachal Explorer (Shimla & Manali)",
    stateOrCountry: "Himachal Pradesh, India",
    coverImage: "https://images.unsplash.com/photo-1605640840605-14ac1855827b?auto=format&fit=crop&q=80&w=1200",
    description: "Pine valleys, colonial heritage, snow peaks, and Atal Tunnel adventure",
    days: [
      {
        id: "him-1",
        dayNumber: 1,
        destinationCity: "Shimla",
        title: "Arrival in Shimla – Queen of the Hills & Mall Road Walk",
        description: "Arrive in Shimla and check in to your hotel. Evening leisure walk on the Ridge, historic Mall Road, Scandal Point, and Christ Church with panoramic Himalayan views.",
        imageUrl: "https://images.unsplash.com/photo-1605640840605-14ac1855827b?auto=format&fit=crop&q=80&w=1200",
      },
      {
        id: "him-2",
        dayNumber: 2,
        destinationCity: "Kufri",
        title: "Excursion to Kufri & Green Valley Nature Tour",
        description: "Drive to Kufri (2,630 m), famous for lush cedar groves and snow-capped Himalayan panoramas. Visit Himalayan Nature Park, Mahasu Peak, and enjoy adventure park rides.",
        imageUrl: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&q=80&w=1200",
      },
      {
        id: "him-3",
        dayNumber: 3,
        destinationCity: "Manali",
        title: "Scenic River Valley Drive from Shimla to Manali via Kullu",
        description: "Spectacular 7-hour road journey descending through Mandi and the scenic Kullu Valley. Stop for white water river rafting and authentic Shawl weaving factories in Kullu. Arrive in Manali by evening.",
        imageUrl: "https://images.unsplash.com/photo-1589182373726-e4f658ab50f0?auto=format&fit=crop&q=80&w=1200",
      },
      {
        id: "him-4",
        dayNumber: 4,
        destinationCity: "Solang Valley",
        title: "Solang Valley Snow Point, Cable Car & Atal Tunnel Adventure",
        description: "Thrilling excursion to Solang Valley for paragliding, zorbing, and quad biking. Drive through the historic 9.02 km Atal Tunnel into the majestic Lahaul Valley and Sissu waterfall.",
        imageUrl: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&q=80&w=1200",
      },
      {
        id: "him-5",
        dayNumber: 5,
        destinationCity: "Manali Departure",
        title: "Hadimba Temple, Vashisht Hot Springs & Departure",
        description: "Visit the 450-year-old wooden Hadimba Devi Temple set amidst dense deodar forests, Tibetan Monastery, and Vashisht Hot Sulphur Springs. Departure with sweet memories.",
        imageUrl: "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&q=80&w=1200",
      },
    ],
  },
  {
    id: "dest-dubai",
    name: "Dazzling Dubai & Desert Wonders",
    stateOrCountry: "United Arab Emirates",
    coverImage: "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&q=80&w=1200",
    description: "Burj Khalifa, Desert Safari, Marina Dhow Cruise & Luxury Shopping",
    days: [
      {
        id: "dxb-1",
        dayNumber: 1,
        destinationCity: "Dubai",
        title: "Arrival in Dubai & Luxury Marina Dhow Cruise Dinner",
        description: "Arrive at Dubai International Airport. VIP private transfer to hotel. In the evening, board a luxury illuminated Marina Dhow Cruise for a 2-hour glide along Dubai Marina with 5-star international buffet dinner and live Tanoura dance show.",
        imageUrl: "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&q=80&w=1200",
      },
      {
        id: "dxb-2",
        dayNumber: 2,
        destinationCity: "Dubai",
        title: "Dubai City Tour & Burj Khalifa 124th Floor Observation Deck",
        description: "Half-day city tour featuring Dubai Frame, Zabeel Palace, Jumeirah Mosque, Burj Al Arab photo stop, and Palm Jumeirah Atlantis. Afternoon at Dubai Mall and take high-speed elevators to At The Top (124th/125th floor) of Burj Khalifa, followed by Dubai Fountain show.",
        imageUrl: "https://images.unsplash.com/photo-1580674684081-7617fbf3d745?auto=format&fit=crop&q=80&w=1200",
      },
      {
        id: "dxb-3",
        dayNumber: 3,
        destinationCity: "Dubai Desert",
        title: "Thrilling Red Dunes Desert Safari with BBQ Dinner & Entertainment",
        description: "Afternoon 4x4 Land Cruiser pick-up for thrilling dune bashing across Lahbab red sand dunes. Experience sandboarding, camel rides, henna painting, fire show, belly dancing, and a sumptuous 5-star BBQ dinner under starlit desert sky.",
        imageUrl: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&q=80&w=1200",
      },
      {
        id: "dxb-4",
        dayNumber: 4,
        destinationCity: "Dubai",
        title: "Miracle Garden & Global Village Cultural Extravaganza",
        description: "Morning visit to Dubai Miracle Garden, world's largest natural flower garden with 150+ million blooming flowers. Evening visit to Global Village showcasing pavilions from 80+ countries, international cuisines, and cultural shows.",
        imageUrl: "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&q=80&w=1200",
      },
      {
        id: "dxb-5",
        dayNumber: 5,
        destinationCity: "Dubai Departure",
        title: "Last Minute Gold Souk Shopping & Airport Departure Transfer",
        description: "Morning visit to traditional Deira Gold and Spice Souks. Later, private transfer to Dubai International Airport for return flight.",
        imageUrl: "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&q=80&w=1200",
      },
    ],
  },
  {
    id: "dest-bali",
    name: "Tropical Bali & Island Paradise",
    stateOrCountry: "Indonesia",
    coverImage: "https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&q=80&w=1200",
    description: "Emerald rice terraces, Uluwatu sunsets, Bali swing, and Nusa Penida",
    days: [
      {
        id: "bali-1",
        dayNumber: 1,
        destinationCity: "Denpasar / Kuta",
        title: "Arrival in Bali & Clifftop Uluwatu Temple Sunset Tour",
        description: "Arrive at Ngurah Rai International Airport Bali. Flower garland welcome and transfer to resort. Late afternoon drive to sacred Uluwatu Temple perched atop a 70-meter cliff with fiery Indian Ocean sunset and dramatic Kecak Fire Dance.",
        imageUrl: "https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&q=80&w=1200",
      },
      {
        id: "bali-2",
        dayNumber: 2,
        destinationCity: "Ubud",
        title: "Ubud Cultural Heart – Tegalalang Rice Terraces, Bali Swing & Monkey Forest",
        description: "Full day in spiritual Ubud. Swing high above the emerald jungle canopy at Aloha Bali Swing. Wander through UNESCO-listed Tegalalang Rice Terraces and encounter playful macaques at Sacred Monkey Forest Sanctuary.",
        imageUrl: "https://images.unsplash.com/photo-1518548419970-58e3b4079ab2?auto=format&fit=crop&q=80&w=1200",
      },
      {
        id: "bali-3",
        dayNumber: 3,
        destinationCity: "Kintamani",
        title: "Mount Batur Active Volcano View & Luwak Coffee Plantation",
        description: "Drive north to Kintamani highland for panoramic views of active Mount Batur volcano and crater lake. Visit traditional Luwak coffee plantation and Tirta Empul holy spring water temple for spiritual blessing.",
        imageUrl: "https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&q=80&w=1200",
      },
      {
        id: "bali-4",
        dayNumber: 4,
        destinationCity: "Nusa Penida",
        title: "Speedboat Excursion to Nusa Penida – Kelingking T-Rex & Broken Beach",
        description: "Early morning speedboat transfer to Nusa Penida island. Visit iconic Kelingking Beach (famous T-Rex shaped cliff), Angel's Billabong natural infinity pool, and Broken Beach with its natural archway.",
        imageUrl: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&q=80&w=1200",
      },
      {
        id: "bali-5",
        dayNumber: 5,
        destinationCity: "Bali Departure",
        title: "Seminyak Beach Club Leisure & Airport Departure",
        description: "Relax at beachfront cafes in Seminyak, souvenir shopping for authentic Balinese handicrafts, and private airport transfer.",
        imageUrl: "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&q=80&w=1200",
      },
    ],
  },
  {
    id: "dest-kerala",
    name: "Kerala God's Own Country",
    stateOrCountry: "Kerala, India",
    coverImage: "https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&q=80&w=1200",
    description: "Munnar rolling tea plantations, Thekkady wildlife & Alleppey backwater houseboats",
    days: [
      {
        id: "ker-1",
        dayNumber: 1,
        destinationCity: "Cochin to Munnar",
        title: "Arrival in Cochin & Scenic Drive to Munnar Tea Valleys",
        description: "Warm welcome at Cochin Airport. Scenic 4-hour uphill drive to Munnar passing Cheeyappara and Valara waterfalls. Check in to misty tea-garden resort with evening walk among aromatic tea plantations.",
        imageUrl: "https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&q=80&w=1200",
      },
      {
        id: "ker-2",
        dayNumber: 2,
        destinationCity: "Munnar",
        title: "Eravikulam National Park, Mattupetty Dam & Echo Point",
        description: "Morning safari into Eravikulam National Park, sanctuary of the endangered Nilgiri Tahr. Visit Mattupetty Dam, speedboating, Echo Point, and the Tata Tea Heritage Museum.",
        imageUrl: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&q=80&w=1200",
      },
      {
        id: "ker-3",
        dayNumber: 3,
        destinationCity: "Thekkady",
        title: "Transfer to Thekkady – Periyar Wildlife Sanctuary & Spice Walk",
        description: "Drive through cardamon and pepper hill slopes to Thekkady. Enjoy a guided spice plantation tour and late afternoon boat safari on Lake Periyar to spot wild elephants, bison, and exotic birds.",
        imageUrl: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&q=80&w=1200",
      },
      {
        id: "ker-4",
        dayNumber: 4,
        destinationCity: "Alleppey",
        title: "Alleppey Backwaters – Traditional Houseboat Cruise & Overnight Stay",
        description: "Board a traditional thatched-roof Kettuvallam (Houseboat) in Alleppey backwaters. Glide past tranquil canals, paddy fields, and coir villages while enjoying freshly prepared authentic Kerala meals.",
        imageUrl: "https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&q=80&w=1200",
      },
      {
        id: "ker-5",
        dayNumber: 5,
        destinationCity: "Cochin Departure",
        title: "Fort Kochi Chinese Fishing Nets & Airport Drop",
        description: "Disembark houseboat and drive to Fort Kochi to see iconic Chinese Fishing Nets, St. Francis Church, and Jewish Synagogue before transfer to Cochin International Airport.",
        imageUrl: "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&q=80&w=1200",
      },
    ],
  },
];

export function getStoredDestinations(): DestinationItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_DESTINATIONS));
      return DEFAULT_DESTINATIONS;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_DESTINATIONS));
    return DEFAULT_DESTINATIONS;
  } catch (err) {
    console.error("Failed to load destinations from localStorage", err);
    return DEFAULT_DESTINATIONS;
  }
}

function persistDestinations(destinations: DestinationItem[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(destinations));
    window.dispatchEvent(new CustomEvent("destination_library_updated", { detail: destinations }));
  } catch (err) {
    console.error("Failed to persist destinations", err);
  }
}

export function saveDestination(item: {
  id?: string;
  name: string;
  stateOrCountry?: string;
  coverImage?: string;
  description?: string;
  days?: DestinationDayTemplate[];
}): DestinationItem {
  const current = getStoredDestinations();
  const now = new Date().toISOString();

  if (item.id) {
    const idx = current.findIndex((d) => d.id === item.id);
    if (idx !== -1) {
      const updated: DestinationItem = {
        ...current[idx],
        name: item.name.trim(),
        stateOrCountry: item.stateOrCountry || current[idx].stateOrCountry,
        coverImage: item.coverImage || current[idx].coverImage,
        description: item.description ?? current[idx].description,
        days: item.days ?? current[idx].days,
        updatedAt: now,
      };
      current[idx] = updated;
      persistDestinations(current);
      return updated;
    }
  }

  // Create new
  const newId = `dest-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  const created: DestinationItem = {
    id: newId,
    name: item.name.trim(),
    stateOrCountry: item.stateOrCountry || "",
    coverImage: item.coverImage || "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&q=80&w=1200",
    description: item.description || "",
    days: item.days || [],
    createdAt: now,
    updatedAt: now,
  };

  const next = [created, ...current];
  persistDestinations(next);
  return created;
}

export function deleteDestination(id: string): void {
  const current = getStoredDestinations();
  const next = current.filter((d) => d.id !== id);
  persistDestinations(next);
}

export function addDayToDestination(
  destinationId: string,
  day: Omit<DestinationDayTemplate, "id"> & { id?: string }
): DestinationItem | null {
  const current = getStoredDestinations();
  const destIndex = current.findIndex((d) => d.id === destinationId);
  if (destIndex === -1) return null;

  const target = current[destIndex];
  const newDayId = day.id || `day-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  const dayNumber = day.dayNumber || target.days.length + 1;

  const newDay: DestinationDayTemplate = {
    id: newDayId,
    dayNumber,
    destinationCity: day.destinationCity.trim(),
    title: day.title.trim(),
    description: day.description.trim(),
    imageUrl: day.imageUrl,
    activities: day.activities,
  };

  const updatedDest: DestinationItem = {
    ...target,
    days: [...target.days, newDay],
    updatedAt: new Date().toISOString(),
  };

  current[destIndex] = updatedDest;
  persistDestinations(current);
  return updatedDest;
}

export function updateDayInDestination(
  destinationId: string,
  updatedDay: DestinationDayTemplate
): DestinationItem | null {
  const current = getStoredDestinations();
  const destIndex = current.findIndex((d) => d.id === destinationId);
  if (destIndex === -1) return null;

  const target = current[destIndex];
  const dayIndex = target.days.findIndex((d) => d.id === updatedDay.id);
  if (dayIndex === -1) return null;

  const updatedDays = [...target.days];
  updatedDays[dayIndex] = updatedDay;

  const updatedDest: DestinationItem = {
    ...target,
    days: updatedDays,
    updatedAt: new Date().toISOString(),
  };

  current[destIndex] = updatedDest;
  persistDestinations(current);
  return updatedDest;
}

export function deleteDayFromDestination(destinationId: string, dayId: string): DestinationItem | null {
  const current = getStoredDestinations();
  const destIndex = current.findIndex((d) => d.id === destinationId);
  if (destIndex === -1) return null;

  const target = current[destIndex];
  const remainingDays = target.days
    .filter((d) => d.id !== dayId)
    .map((d, idx) => ({ ...d, dayNumber: idx + 1 }));

  const updatedDest: DestinationItem = {
    ...target,
    days: remainingDays,
    updatedAt: new Date().toISOString(),
  };

  current[destIndex] = updatedDest;
  persistDestinations(current);
  return updatedDest;
}

export function resetDestinationsToDefaults(): DestinationItem[] {
  persistDestinations(DEFAULT_DESTINATIONS);
  return DEFAULT_DESTINATIONS;
}
