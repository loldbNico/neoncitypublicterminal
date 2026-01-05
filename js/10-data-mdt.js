/**
 * MDT Database - Template data for all MDT categories
 * Search by ID (1, 2, 3...) or by name/plate/etc.
 */

window.MDT_DATA = {
  // ========== CITIZENS ==========
  citizens: [
    { id: 1, firstName: 'Marcus', lastName: 'Chen', dob: '1989-03-14', gender: 'Male', pronouns: 'he/him', phone: '555-0101', address: '1420 Neon Core Ave, Apt 12B', occupation: 'Software Engineer', licenseStatus: 'Valid', licenseClass: 'C', weaponLicense: 'Valid', dna: 'ATCG-1138-00A', fingerprints: 'NC-CHEN-1989', priors: [], warrants: [], notes: 'No criminal history.', photo: './77web.png' },
    { id: 2, firstName: 'Sarah', lastName: 'Williams', dob: '1995-07-22', gender: 'Female', pronouns: 'she/her', phone: '555-0102', address: '88 Mirror Hills Dr', occupation: 'Nurse', licenseStatus: 'Valid', licenseClass: 'C', weaponLicense: 'Valid', dna: 'ATCG-5522-07B', fingerprints: 'NC-WILL-1995', priors: [], warrants: [], notes: 'Emergency contact: David Williams (brother).', photo: './77web.png' },
    { id: 3, firstName: 'Viktor', lastName: 'Kozlov', dob: '1982-11-30', gender: 'Male', pronouns: 'he/him', phone: '555-0103', address: '2200 South Side Blvd', occupation: 'Unemployed', licenseStatus: 'Suspended', licenseClass: 'C', weaponLicense: 'Suspended', dna: 'ATCG-3344-11C', fingerprints: 'NC-KOZ-1982', priors: ['Assault (2019)', 'DUI (2021)'], warrants: ['WAR-2024-0002'], notes: 'Known associate of South Side gang. ACTIVE WARRANT - Approach with caution.', photo: './77web.png' },
    { id: 4, firstName: 'Elena', lastName: 'Vasquez', dob: '1991-05-08', gender: 'Female', pronouns: 'she/her', phone: '555-0104', address: '445 Vespucci Beach Rd', occupation: 'Bartender', licenseStatus: 'Valid', licenseClass: 'M', weaponLicense: 'Valid', dna: 'ATCG-7781-05A', fingerprints: 'NC-VAS-1991', priors: ['Petty Theft (2018)'], warrants: [], notes: 'Works at The Neon Lounge.', photo: './77web.png' },
    { id: 5, firstName: 'James', lastName: 'Morrison', dob: '1978-09-15', gender: 'Male', pronouns: 'he/him', phone: '555-0105', address: '1200 Rockford Hills Estate', occupation: 'CEO - Morrison Industries', licenseStatus: 'Valid', licenseClass: 'C', weaponLicense: 'Valid', dna: 'ATCG-9900-09X', fingerprints: 'NC-MOR-1978', priors: [], warrants: [], notes: 'High-profile individual. Handle with discretion.', photo: './77web.png' },
    { id: 6, firstName: 'Yuki', lastName: 'Tanaka', dob: '1993-02-28', gender: 'Female', pronouns: 'she/her', phone: '555-0106', address: '78 Little Seoul Plaza', occupation: 'Restaurant Owner', licenseStatus: 'Valid', licenseClass: 'C', weaponLicense: 'Valid', dna: 'ATCG-4411-02Q', fingerprints: 'NC-TAN-1993', priors: [], warrants: [], notes: 'Owns "Tanaka Ramen" in Little Seoul.', photo: './77web.png' },
    { id: 7, firstName: 'Derek', lastName: 'Stone', dob: '1985-12-03', gender: 'Male', pronouns: 'he/him', phone: '555-0107', address: '999 Pacific Bluffs Way', occupation: 'Private Security', licenseStatus: 'Valid', licenseClass: 'C', weaponLicense: 'Valid', dna: 'ATCG-0066-12B', fingerprints: 'NC-STO-1985', priors: ['Assault (2017) - Dismissed'], warrants: [], notes: 'Former military. Licensed CCW holder.', photo: './77web.png' },
    { id: 8, firstName: 'Maria', lastName: 'Santos', dob: '1988-06-17', gender: 'Female', pronouns: 'she/her', phone: '555-0108', address: '320 La Puerta St', occupation: 'Mechanic', licenseStatus: 'Valid', licenseClass: 'C', weaponLicense: 'Valid', dna: 'ATCG-5521-06T', fingerprints: 'NC-SAN-1988', priors: [], warrants: [], notes: 'Owns Santos Auto Repair.', photo: './77web.png' },
    { id: 9, firstName: 'Tyler', lastName: 'Reed', dob: '2001-04-25', gender: 'Male', pronouns: 'he/him', phone: '555-0109', address: '1800 Vinewood Hills Rd', occupation: 'Student', licenseStatus: 'Provisional', licenseClass: 'C', weaponLicense: 'Pending', dna: 'ATCG-8722-04M', fingerprints: 'NC-REE-2001', priors: ['Drug Possession (2024) - Pending'], warrants: ['WAR-2024-0001'], notes: 'Outstanding warrant for failure to appear. Vehicle flagged for unpaid citations.', photo: './77web.png' },
    { id: 10, firstName: 'Nina', lastName: 'Petrov', dob: '1990-08-12', gender: 'Female', pronouns: 'she/her', phone: '555-0110', address: '600 Palomino Lands Ranch', occupation: 'Veterinarian', licenseStatus: 'Valid', licenseClass: 'C', weaponLicense: 'Valid', dna: 'ATCG-2255-08C', fingerprints: 'NC-PET-1990', priors: [], warrants: [], notes: 'Rural area resident.', photo: './77web.png' },

    { id: 11, firstName: 'Annabelle', lastName: 'Celestine', dob: '1982-02-08', gender: 'Female', pronouns: 'she/her', phone: '555-0144', address: 'Penthouse 1, Pacific Bluffs Tower', occupation: 'SecuroServ - Executive Director', licenseStatus: 'Valid', licenseClass: 'C', weaponLicense: 'Valid', dna: 'ATCG-1982-0208-AC', fingerprints: 'NC-CELE-1982', priors: [], warrants: [], notes: 'SecuroServ executive. Highest-ranking active leadership. High-value security risk.', photo: './mdt_citizen_0011.png' },
  ],

  // ========== ORGANIZATIONS ==========
  organizations: [
    {
      id: 1,
      name: 'Tanaka Ramen Group',
      type: 'Business',
      logo: './mw.png',
      hq: '78 Little Seoul Plaza',
      notes: 'Commercial food-service group. Owns multiple restaurant properties across Little Seoul.',
      employees: [
        { citizenId: 6, rank: 'Owner' },
        { citizenId: 2, rank: 'Medical Consultant' }
      ]
    },
    {
      id: 2,
      name: 'Morrison Industries',
      type: 'Small Business',
      logo: './77web.png',
      hq: '1200 Rockford Hills Estate',
      notes: 'High-profile private business entity with security contracts.',
      employees: [
        { citizenId: 5, rank: 'CEO' },
        { citizenId: 7, rank: 'Security Contractor' }
      ]
    },
    {
      id: 3,
      name: 'SecuroServ Holdings',
      type: 'Security / Logistics',
      logo: './mw.png',
      hq: 'Warehouse 7, Neon City Ports',
      notes: 'RESTRICTED operations across port facilities.',
      employees: [
        { citizenId: 7, rank: 'Contractor' }
      ]
    },

    /* Government entities (for badge/logo overlays) */
    {
      id: 101,
      name: 'NCPD',
      type: 'Government',
      logo: './NEON_CITY_PRISON.png',
      hq: 'NCPD Central',
      notes: 'Neon City Police Department. Sworn officers and civilian staff.',
      employees: [
        { citizenId: 1, rank: 'Analyst' },
        { citizenId: 7, rank: 'Contractor' }
      ]
    },
    {
      id: 102,
      name: 'TacMed',
      type: 'Government',
      logo: './TACMED.png',
      hq: 'Pillbox Hill Medical',
      notes: 'Tactical medical response unit.',
      employees: [
        { citizenId: 2, rank: 'Medic' }
      ]
    },
    {
      id: 103,
      name: 'Neon City Council',
      type: 'Government Agency',
      logo: './77web.png',
      hq: 'City Hall',
      notes: 'Municipal governance and permitting authority.',
      employees: [
        { citizenId: 5, rank: 'Council Liaison' }
      ]
    },
    {
      id: 108,
      name: 'APEX',
      type: 'Government Agency',
      logo: './APEX_HQ.png',
      hq: 'APEX HQ',
      notes: 'Advanced Projects & Executive eXtractions (APEX). High-clearance operations and special projects.',
      employees: []
    },
    {
      id: 109,
      name: 'Neon Net Authority',
      type: 'Government Agency',
      logo: './DATA_SHARD.png',
      hq: 'Neon Net Exchange',
      notes: 'Network oversight, communications infrastructure, data compliance and warrants.',
      employees: []
    },

    /* Major factions / agencies */
    {
      id: 104,
      name: 'Merryweather',
      type: 'Corporation',
      logo: './MERRYWEATHER_BASE.png',
      hq: 'Merryweather Base',
      notes: 'Private military contractor. Restricted facilities and high-risk operations.',
      employees: [
        { citizenId: 7, rank: 'Contractor' }
      ]
    },
    {
      id: 105,
      name: 'SecuroServ',
      type: 'Corporation',
      logo: './SECUROSERV_PORT.png',
      hq: 'Neon City Ports (SecuroServ)',
      notes: 'Security and logistics across port facilities. Restricted access.',
      employees: [
        { citizenId: 11, rank: 'Executive Director' },
        { citizenId: 7, rank: 'Contractor' },
        { citizenId: 1, rank: 'Analyst' }
      ]
    },
    {
      id: 106,
      name: 'Humane Labs',
      type: 'Corporation',
      logo: './HUMANE_LABS.png',
      hq: 'Humane Labs Campus',
      notes: 'Biomedical research and lab operations. Restricted access for authorized staff only.',
      employees: [
        { citizenId: 10, rank: 'Veterinary Consultant' }
      ]
    },
    {
      id: 107,
      name: 'Humane Research',
      type: 'Research',
      logo: './HUMANE_LABS.png',
      hq: 'Humane Research Annex',
      notes: 'Special projects research division (HUMINT / biotech).',
      employees: [
        { citizenId: 2, rank: 'Research Nurse' }
      ]
    }
  ],

  // ========== PROPERTIES ==========
  properties: [
    { id: 1, address: '1420 Neon Core Ave, Apt 12B', type: 'Apartment', owner: 'Marcus Chen', value: '₡450,000', taxStatus: 'Current', notes: 'Standard residential unit.' },
    { id: 2, address: '88 Mirror Hills Dr', type: 'Single Family Home', owner: 'Williams Family Trust', value: '₡1,200,000', taxStatus: 'Current', notes: 'Gated community.' },
    { id: 3, address: '2200 South Side Blvd', type: 'Apartment', owner: 'South Side Properties LLC', value: '₡180,000', taxStatus: 'Delinquent', notes: 'Known gang activity in area.' },
    { id: 4, address: '445 Vespucci Beach Rd', type: 'Condo', owner: 'Elena Vasquez', value: '₡680,000', taxStatus: 'Current', notes: 'Beachfront property.' },
    { id: 5, address: '1200 Rockford Hills Estate', type: 'Mansion', owner: 'Morrison Industries', value: '₡12,500,000', taxStatus: 'Current', notes: 'High security. Private road access.' },
    { id: 6, address: '78 Little Seoul Plaza', type: 'Commercial', owner: 'Tanaka Ramen Group', value: '₡920,000', taxStatus: 'Current', notes: 'Mixed use - restaurant ground floor.' },
    { id: 7, address: '999 Pacific Bluffs Way', type: 'Single Family Home', owner: 'Derek Stone', value: '₡2,100,000', taxStatus: 'Current', notes: 'Cliffside property. Security cameras.' },
    { id: 8, address: '320 La Puerta St', type: 'Commercial', owner: 'Santos Auto LLC', value: '₡540,000', taxStatus: 'Current', notes: 'Auto repair shop with residential above.' },
    { id: 9, address: 'Warehouse 7, Neon City Ports', type: 'Industrial', owner: 'SecuroServ Holdings', value: '₡3,200,000', taxStatus: 'Current', notes: 'RESTRICTED - SecuroServ property.' },
    { id: 10, address: '600 Palomino Lands Ranch', type: 'Ranch', owner: 'Petrov Family', value: '₡890,000', taxStatus: 'Current', notes: '40 acres. Livestock permitted.' },

    { id: 11, citizenId: 11, address: 'Penthouse 1, Pacific Bluffs Tower', type: 'Penthouse', owner: 'Annabelle Celestine', value: '₡18,900,000', taxStatus: 'Current', notes: 'Ultra-luxury high-rise penthouse. Private elevator.' },
    { id: 12, citizenId: 11, address: 'Unit 44B, Mirror Hills Skyline', type: 'Luxury Apartment', owner: 'Annabelle Celestine', value: '₡6,200,000', taxStatus: 'Current', notes: 'High-rise unit with secured parking and concierge.' },
    { id: 13, citizenId: 11, address: '12 Rockford Hills Crest', type: 'Estate', owner: 'Annabelle Celestine', value: '₡24,500,000', taxStatus: 'Current', notes: 'Gated estate property. Private security perimeter.' },
    { id: 14, citizenId: 11, address: '101 Vespucci Beachfront Way', type: 'Luxury Condo', owner: 'Annabelle Celestine', value: '₡9,800,000', taxStatus: 'Current', notes: 'Beachfront property. Secure subterranean garage.' }
  ],

  // ========== VEHICLES ==========
  vehicles: [
    { id: 1, plate: 'NCX-1420', make: 'Ubermacht', model: 'Oracle', year: 2022, color: 'Black', owner: 'Marcus Chen', status: 'Registered', flags: [], notes: '' },
    { id: 2, plate: 'MRH-8842', make: 'Benefactor', model: 'Schafter', year: 2023, color: 'White', owner: 'Sarah Williams', status: 'Registered', flags: [], notes: '' },
    { id: 3, plate: 'SSB-2200', make: 'Albany', model: 'Buccaneer', year: 1998, color: 'Red', owner: 'Viktor Kozlov', status: 'Expired', flags: ['BOLO - Associated with robbery'], notes: 'Tinted windows. Custom rims.' },
    { id: 4, plate: 'VSP-4455', make: 'Pegassi', model: 'Bati 801', year: 2021, color: 'Yellow', owner: 'Elena Vasquez', status: 'Registered', flags: [], notes: 'Motorcycle.' },
    { id: 5, plate: 'RKF-0001', make: 'Enus', model: 'Paragon R', year: 2024, color: 'Midnight Blue', owner: 'James Morrison', status: 'Registered', flags: [], notes: 'Armored variant. VIP vehicle.' },
    { id: 6, plate: 'LSP-7878', make: 'Karin', model: 'Sultan RS', year: 2020, color: 'Silver', owner: 'Yuki Tanaka', status: 'Registered', flags: [], notes: '' },
    { id: 7, plate: 'PBW-9990', make: 'Gallivanter', model: 'Baller', year: 2022, color: 'Black', owner: 'Derek Stone', status: 'Registered', flags: [], notes: 'Tinted windows - exempt (security).' },
    { id: 8, plate: 'LPT-3200', make: 'Vapid', model: 'Bobcat XL', year: 2019, color: 'Orange', owner: 'Maria Santos', status: 'Registered', flags: [], notes: 'Commercial plates.' },
    { id: 9, plate: 'VWH-1800', make: 'Obey', model: 'Tailgater', year: 2023, color: 'Gray', owner: 'Tyler Reed', status: 'Suspended', flags: ['Unpaid citations'], notes: 'Registration suspended - unpaid fines.' },
    { id: 10, plate: 'PLR-6000', make: 'Bravado', model: 'Bison', year: 2018, color: 'Green', owner: 'Nina Petrov', status: 'Registered', flags: [], notes: 'Ranch use vehicle.' },

    { id: 11, citizenId: 11, plate: 'ACE-1982', make: 'Lampadati', model: 'Furore GT', year: 2024, color: 'Pearlescent White', owner: 'Annabelle Celestine', status: 'Registered', flags: [], notes: 'SecuroServ executive vehicle. Priority escort eligible.' }
  ],

  // ========== WEAPONS ==========
  weapons: [
    { id: 1, serial: 'WPN-00001', type: 'Pistol', make: 'Hawk & Little', model: 'Combat Pistol', caliber: '9mm', owner: 'Derek Stone', status: 'Registered', ccw: true, notes: 'CCW permit valid.' },
    { id: 2, serial: 'WPN-00002', type: 'Shotgun', make: 'Shrewsbury', model: 'Pump Shotgun', caliber: '12 Gauge', owner: 'Nina Petrov', status: 'Registered', ccw: false, notes: 'Home defense.' },
    { id: 3, serial: 'WPN-00003', type: 'Rifle', make: 'Vom Feuer', model: 'Carbine Rifle', caliber: '5.56mm', owner: 'James Morrison', status: 'Registered', ccw: false, notes: 'Security detail use.' },
    { id: 4, serial: 'WPN-00004', type: 'Pistol', make: 'Hawk & Little', model: 'Pistol .50', caliber: '.50 AE', owner: 'Unknown', status: 'Stolen', ccw: false, notes: 'STOLEN - Report #2024-0892' },
    { id: 5, serial: 'WPN-00005', type: 'SMG', make: 'Coil', model: 'Combat PDW', caliber: '9mm', owner: 'NCPD Armory', status: 'Registered', ccw: false, notes: 'Department issued.' },
    { id: 6, serial: 'WPN-00006', type: 'Pistol', make: 'Shrewsbury', model: 'SNS Pistol', caliber: '.380 ACP', owner: 'Elena Vasquez', status: 'Registered', ccw: true, notes: 'CCW permit valid.' },
    { id: 7, serial: 'WPN-00007', type: 'Rifle', make: 'Shrewsbury', model: 'Marksman Rifle', caliber: '.308 WIN', owner: 'Derek Stone', status: 'Registered', ccw: false, notes: 'Hunting rifle.' },
    { id: 8, serial: 'UNKNOWN', type: 'Pistol', make: 'Unknown', model: 'Unknown', caliber: '9mm', owner: 'Unknown', status: 'Unregistered', ccw: false, notes: 'Recovered from crime scene - Case #2024-1102' },
    { id: 9, serial: 'WPN-00009', type: 'Taser', make: 'Coil', model: 'Stun Gun', caliber: 'N/A', owner: 'Private Security Inc', status: 'Registered', ccw: false, notes: 'Non-lethal.' },
    { id: 10, serial: 'WPN-00010', type: 'Shotgun', make: 'Vom Feuer', model: 'Sweeper', caliber: '12 Gauge', owner: 'NCPD Armory', status: 'Registered', ccw: false, notes: 'Riot control.' }
  ],

  // ========== MEDICAL PROFILES ==========
  medicalProfiles: [
    { id: 1, patientId: 'PAT-0001', name: 'Marcus Chen', bloodType: 'A+', allergies: ['Penicillin'], conditions: [], emergencyContact: 'Wei Chen (Father) - 555-0201', notes: 'No significant medical history.' },
    { id: 2, patientId: 'PAT-0002', name: 'Sarah Williams', bloodType: 'O-', allergies: [], conditions: [], emergencyContact: 'David Williams (Brother) - 555-0202', notes: 'Universal donor. Healthcare worker.' },
    { id: 3, patientId: 'PAT-0003', name: 'Viktor Kozlov', bloodType: 'B+', allergies: ['Sulfa drugs'], conditions: ['Hypertension', 'Prior GSW (2020)'], emergencyContact: 'None listed', notes: 'History of violence. Caution advised.' },
    { id: 4, patientId: 'PAT-0004', name: 'Elena Vasquez', bloodType: 'A-', allergies: [], conditions: ['Asthma'], emergencyContact: 'Rosa Vasquez (Mother) - 555-0204', notes: 'Carries inhaler.' },
    { id: 5, patientId: 'PAT-0005', name: 'James Morrison', bloodType: 'AB+', allergies: ['Latex'], conditions: ['Diabetes Type 2'], emergencyContact: 'Morrison Industries Security - 555-0205', notes: 'VIP patient. Private room required.' },
    { id: 6, patientId: 'PAT-0006', name: 'Yuki Tanaka', bloodType: 'O+', allergies: [], conditions: [], emergencyContact: 'Kenji Tanaka (Husband) - 555-0206', notes: 'No significant medical history.' },
    { id: 7, patientId: 'PAT-0007', name: 'Derek Stone', bloodType: 'O+', allergies: [], conditions: ['PTSD', 'Prior combat injuries'], emergencyContact: 'VA Hospital - 555-0207', notes: 'Veteran. Metal fragments in left leg.' },
    { id: 8, patientId: 'PAT-0008', name: 'Maria Santos', bloodType: 'B-', allergies: ['Ibuprofen'], conditions: [], emergencyContact: 'Carlos Santos (Son) - 555-0208', notes: '' },
    { id: 9, patientId: 'PAT-0009', name: 'Tyler Reed', bloodType: 'A+', allergies: [], conditions: ['ADHD'], emergencyContact: 'Susan Reed (Mother) - 555-0209', notes: 'Prescribed Adderall.' },
    { id: 10, patientId: 'PAT-0010', name: 'Nina Petrov', bloodType: 'AB-', allergies: ['Bee stings'], conditions: [], emergencyContact: 'Alexei Petrov (Husband) - 555-0210', notes: 'Carries EpiPen.' }
  ],

  // ========== NCPD REPORTS ==========
  ncpdReports: [
    { id: 1, caseNum: '2024-0001', type: 'Traffic Stop', date: '2024-01-15', time: '14:32', location: 'Neon Core Ave & 5th St', officer: 'Ofc. Rodriguez', suspects: ['Viktor Kozlov'], status: 'Closed', summary: 'Routine traffic stop. Expired registration. Citation issued.' },
    { id: 2, caseNum: '2024-0045', type: 'Burglary', date: '2024-01-28', time: '03:15', location: '78 Little Seoul Plaza', officer: 'Det. Park', suspects: ['Unknown'], status: 'Open', summary: 'Break-in at Tanaka Ramen. Cash register emptied. No witnesses.' },
    { id: 3, caseNum: '2024-0102', type: 'Assault', date: '2024-02-14', time: '23:45', location: 'The Neon Lounge, Vespucci', officer: 'Ofc. Martinez', suspects: ['John Doe (unidentified)'], status: 'Open', summary: 'Bar fight. Victim transported to Pillbox. Suspect fled on foot.' },
    { id: 4, caseNum: '2024-0156', type: 'Vehicle Theft', date: '2024-02-22', time: '08:00', location: '2200 South Side Blvd', officer: 'Ofc. Johnson', suspects: ['Unknown'], status: 'Open', summary: 'Vehicle reported stolen. BOLO issued for plate SSB-2200.' },
    { id: 5, caseNum: '2024-0201', type: 'Domestic Disturbance', date: '2024-03-01', time: '19:22', location: '1800 Vinewood Hills Rd', officer: 'Ofc. Chen', suspects: [], status: 'Closed', summary: 'Noise complaint. Verbal dispute between roommates. No charges.' },
    { id: 6, caseNum: '2024-0289', type: 'Armed Robbery', date: '2024-03-15', time: '21:08', location: '24/7 Store, Pacific Bluffs', officer: 'Det. Stone', suspects: ['Male, black mask, 6ft'], status: 'Open', summary: 'Store clerk held at gunpoint. ₡2,400 taken. Weapon: pistol.' },
    { id: 7, caseNum: '2024-0334', type: 'Drug Possession', date: '2024-03-22', time: '16:40', location: 'South Side Park', officer: 'Ofc. Williams', suspects: ['Tyler Reed'], status: 'Pending', summary: 'Subject found with marijuana. Minor amount. Citation pending.' },
    { id: 8, caseNum: '2024-0412', type: 'Missing Person', date: '2024-04-02', time: '10:00', location: 'Reported at NCPD Central', officer: 'Det. Vasquez', suspects: [], status: 'Open', summary: 'Jessica Lane, 24, last seen Mirror Hills. No foul play suspected.' },
    { id: 9, caseNum: '2024-0501', type: 'Homicide', date: '2024-04-15', time: '02:33', location: 'Warehouse 12, Neon City Ports', officer: 'Det. Morrison', suspects: ['Unknown'], status: 'Open', summary: 'Body discovered. Male, 30s, GSW. Gang-related suspected.' },
    { id: 10, caseNum: '2024-0567', type: 'Noise Complaint', date: '2024-04-28', time: '01:15', location: '1200 Rockford Hills Estate', officer: 'Ofc. Taylor', suspects: [], status: 'Closed', summary: 'Party noise. Resident compliant. Warning issued.' }
  ],

  // ========== MEDICAL REPORTS ==========
  medicalReports: [
    { id: 1, reportNum: 'MED-2024-0001', date: '2024-01-10', patient: 'Viktor Kozlov', facility: 'Pillbox Hill Medical', type: 'ER Visit', diagnosis: 'Laceration - right hand', treatment: 'Sutures (8 stitches)', notes: 'Patient uncooperative. Left AMA.' },
    { id: 2, reportNum: 'MED-2024-0015', date: '2024-01-22', patient: 'James Morrison', facility: 'Mount Zonah', type: 'Routine Checkup', diagnosis: 'Diabetes management', treatment: 'Medication adjustment', notes: 'A1C levels improved.' },
    { id: 3, reportNum: 'MED-2024-0034', date: '2024-02-14', patient: 'John Doe', facility: 'Pillbox Hill Medical', type: 'ER Visit', diagnosis: 'Blunt force trauma - facial', treatment: 'CT scan, observation', notes: 'Victim of assault. NCPD notified. Case #2024-0102.' },
    { id: 4, reportNum: 'MED-2024-0056', date: '2024-02-28', patient: 'Elena Vasquez', facility: 'Central Los Santos Medical', type: 'ER Visit', diagnosis: 'Asthma attack', treatment: 'Nebulizer, steroids', notes: 'Triggered by smoke exposure. Released same day.' },
    { id: 5, reportNum: 'MED-2024-0078', date: '2024-03-10', patient: 'Derek Stone', facility: 'VA Medical Center', type: 'Psychiatric', diagnosis: 'PTSD - follow up', treatment: 'Therapy session', notes: 'Stable. Continue current treatment plan.' },
    { id: 6, reportNum: 'MED-2024-0099', date: '2024-03-18', patient: 'Sarah Williams', facility: 'Pillbox Hill Medical', type: 'Occupational', diagnosis: 'Needle stick injury', treatment: 'Blood tests, prophylaxis', notes: 'Low risk exposure. Follow up in 6 weeks.' },
    { id: 7, reportNum: 'MED-2024-0112', date: '2024-03-25', patient: 'Unknown Male', facility: 'Pillbox Hill Medical', type: 'ER Visit', diagnosis: 'DOA - GSW', treatment: 'N/A', notes: 'Pronounced dead on arrival. NCPD Case #2024-0501.' },
    { id: 8, reportNum: 'MED-2024-0134', date: '2024-04-05', patient: 'Nina Petrov', facility: 'Sandy Shores Medical', type: 'ER Visit', diagnosis: 'Allergic reaction - bee sting', treatment: 'Epinephrine, observation', notes: 'Anaphylaxis. EpiPen administered by patient prior to arrival.' },
    { id: 9, reportNum: 'MED-2024-0156', date: '2024-04-12', patient: 'Tyler Reed', facility: 'Central Los Santos Medical', type: 'ER Visit', diagnosis: 'Anxiety attack', treatment: 'Benzodiazepine, counseling referral', notes: 'Stress-related. Academic pressure cited.' },
    { id: 10, reportNum: 'MED-2024-0178', date: '2024-04-20', patient: 'Maria Santos', facility: 'Pillbox Hill Medical', type: 'ER Visit', diagnosis: 'Chemical burn - hand', treatment: 'Irrigation, bandaging', notes: 'Workplace injury. Workers comp filed.' }
  ],

  // ========== NCC REPORTS ==========
  nccReports: [
    { id: 1, reportNum: 'NCC-2024-0001', date: '2024-01-05', type: 'Zoning Violation', location: '320 La Puerta St', complainant: 'Anonymous', status: 'Resolved', summary: 'Auto shop operating outside permitted hours. Warning issued.' },
    { id: 2, reportNum: 'NCC-2024-0012', date: '2024-01-18', type: 'Building Permit', location: '1200 Rockford Hills Estate', applicant: 'Morrison Industries', status: 'Approved', summary: 'Pool house addition. Permit #BP-2024-0089.' },
    { id: 3, reportNum: 'NCC-2024-0034', date: '2024-02-02', type: 'Health Inspection', location: '78 Little Seoul Plaza', inspector: 'H. Kim', status: 'Passed', summary: 'Tanaka Ramen - routine inspection. Score: 96/100.' },
    { id: 4, reportNum: 'NCC-2024-0056', date: '2024-02-15', type: 'Noise Ordinance', location: '2200 South Side Blvd', complainant: 'Multiple residents', status: 'Under Investigation', summary: 'Ongoing noise complaints. Multiple warnings issued.' },
    { id: 5, reportNum: 'NCC-2024-0078', date: '2024-02-28', type: 'Business License', location: '445 Vespucci Beach Rd', applicant: 'Elena Vasquez', status: 'Denied', summary: 'Home business application denied. Zoning restrictions.' },
    { id: 6, reportNum: 'NCC-2024-0089', date: '2024-03-08', type: 'Environmental', location: 'Neon City Ports', complainant: 'Green NC Coalition', status: 'Under Investigation', summary: 'Alleged chemical dumping. EPA notified.' },
    { id: 7, reportNum: 'NCC-2024-0101', date: '2024-03-15', type: 'Traffic Study', location: 'Neon Core Ave corridor', requester: 'City Planning', status: 'In Progress', summary: 'Traffic flow analysis for proposed light rail.' },
    { id: 8, reportNum: 'NCC-2024-0123', date: '2024-03-28', type: 'Demolition Permit', location: '1500 South Side Industrial', applicant: 'Urban Renewal LLC', status: 'Approved', summary: 'Condemned warehouse demolition approved.' },
    { id: 9, reportNum: 'NCC-2024-0145', date: '2024-04-10', type: 'Liquor License', location: 'The Neon Lounge, Vespucci', applicant: 'NL Entertainment LLC', status: 'Renewal Approved', summary: 'Annual renewal. No violations on record.' },
    { id: 10, reportNum: 'NCC-2024-0167', date: '2024-04-22', type: 'Public Works', location: 'Mirror Hills Dr', requester: 'HOA', status: 'Scheduled', summary: 'Street repaving scheduled for May 2024.' }
  ],

  // ========== PENAL CODE ==========
  // Loaded from `js/11-data-penal-code.js`.
  penalCode: [],

  // ========== STATE LAWS ==========
  stateLaws: [
    { id: 1, code: 'SL-001', title: 'Speed Limit Violation', category: 'Infraction', fine: '₡150-₡500', points: 1, description: 'Exceeding posted speed limits.' },
    { id: 2, code: 'SL-002', title: 'Reckless Driving', category: 'Misdemeanor', fine: '₡1,000', points: 2, description: 'Driving with willful disregard for safety.' },
    { id: 3, code: 'SL-003', title: 'DUI/DWI', category: 'Misdemeanor/Felony', fine: '₡5,000-₡15,000', points: 4, description: 'Operating vehicle under influence of alcohol/drugs.' },
    { id: 4, code: 'SL-004', title: 'Driving Without License', category: 'Misdemeanor', fine: '₡500', points: 2, description: 'Operating vehicle without valid license.' },
    { id: 5, code: 'SL-005', title: 'Expired Registration', category: 'Infraction', fine: '₡250', points: 0, description: 'Operating vehicle with expired registration.' },
    { id: 6, code: 'SL-010', title: 'Weapons Permit Violation', category: 'Misdemeanor', fine: '₡2,500', points: 0, description: 'Carrying weapon without proper permit.' },
    { id: 7, code: 'SL-011', title: 'Illegal Discharge', category: 'Felony', fine: '₡10,000', points: 0, description: 'Discharging firearm in prohibited area.' },
    { id: 8, code: 'SL-020', title: 'Trespassing', category: 'Misdemeanor', fine: '₡750', points: 0, description: 'Entering private property without permission.' },
    { id: 9, code: 'SL-021', title: 'Restricted Area Violation', category: 'Felony', fine: '₡25,000', points: 0, description: 'Unauthorized entry to restricted government/military area.' },
    { id: 10, code: 'SL-030', title: 'Drug Possession', category: 'Misdemeanor/Felony', fine: '₡1,000-₡50,000', points: 0, description: 'Possession of controlled substances. Severity varies.' }
  ],

  // ========== WARRANTS (linked to citizens) ==========
  warrants: [
    { id: 1, warrantNum: 'WAR-2024-0001', type: 'Arrest', citizenId: 9, citizenName: 'Tyler Reed', issuedDate: '2024-03-15', issuedBy: 'Judge M. Harrison', charges: ['Failure to Appear - Traffic Court'], status: 'Active', bail: '₡2,500', notes: 'Subject missed scheduled traffic court date. Minor warrant.' },
    { id: 2, warrantNum: 'WAR-2024-0002', type: 'Arrest', citizenId: 3, citizenName: 'Viktor Kozlov', issuedDate: '2024-04-20', issuedBy: 'Judge R. Chen', charges: ['Assault', 'Battery', 'Resisting Arrest'], status: 'Active', bail: '₡50,000', notes: 'Subject is considered dangerous. Approach with caution. Known gang ties.' },
    { id: 3, warrantNum: 'WAR-2024-0003', type: 'Search', citizenId: null, citizenName: null, issuedDate: '2024-04-22', issuedBy: 'Judge L. Vasquez', charges: [], status: 'Active', bail: 'N/A', notes: 'Search warrant for 2200 South Side Blvd. Related to drug trafficking investigation.' },
    { id: 4, warrantNum: 'WAR-2024-0004', type: 'Arrest', citizenId: null, citizenName: 'John Doe (Unknown Male)', issuedDate: '2024-03-16', issuedBy: 'Judge M. Harrison', charges: ['Armed Robbery'], status: 'Active', bail: '₡100,000', notes: 'Suspect in 24/7 Store robbery. Case #2024-0289. Male, approximately 6ft, wore black mask.' },
    { id: 5, warrantNum: 'WAR-2023-0156', type: 'Arrest', citizenId: 3, citizenName: 'Viktor Kozlov', issuedDate: '2023-11-08', issuedBy: 'Judge K. Patel', charges: ['DUI'], status: 'Served', bail: 'N/A', notes: 'Warrant served 2023-11-15. Subject arrested and processed.' }
  ],

  // ========== ARRESTS (linked to citizens) ==========
  arrests: [
    { id: 1, arrestNum: 'ARR-2024-0001', citizenId: 3, citizenName: 'Viktor Kozlov', date: '2024-01-15', time: '14:45', location: 'Neon Core Ave & 5th St', arrestingOfficer: 'Ofc. Rodriguez', charges: ['Expired Registration', 'Driving with Suspended License'], status: 'Processed', relatedCase: '2024-0001', notes: 'Routine traffic stop. Subject was non-compliant but cooperated after backup arrived.' },
    { id: 2, arrestNum: 'ARR-2024-0012', citizenId: 9, citizenName: 'Tyler Reed', date: '2024-03-22', time: '16:55', location: 'South Side Park', arrestingOfficer: 'Ofc. Williams', charges: ['Drug Possession - Marijuana'], status: 'Pending Court', relatedCase: '2024-0334', notes: 'Minor in possession. Small amount. Released to parent custody pending court date.' },
    { id: 3, arrestNum: 'ARR-2023-0089', citizenId: 3, citizenName: 'Viktor Kozlov', date: '2023-11-15', time: '02:30', location: '2200 South Side Blvd', arrestingOfficer: 'Ofc. Martinez', charges: ['DUI', 'Reckless Driving'], status: 'Convicted', relatedCase: '2023-0892', notes: 'Warrant arrest. Subject found intoxicated at residence. Blood alcohol 0.14.' },
    { id: 4, arrestNum: 'ARR-2019-0234', citizenId: 3, citizenName: 'Viktor Kozlov', date: '2019-06-12', time: '23:15', location: 'The Neon Lounge, Vespucci', arrestingOfficer: 'Ofc. Stone', charges: ['Assault', 'Disorderly Conduct'], status: 'Convicted', relatedCase: '2019-0456', notes: 'Bar fight. Victim required hospitalization. Subject served 6 months.' },
    { id: 5, arrestNum: 'ARR-2018-0567', citizenId: 4, citizenName: 'Elena Vasquez', date: '2018-08-20', time: '15:30', location: 'Vespucci Beach Boardwalk', arrestingOfficer: 'Ofc. Chen', charges: ['Petty Theft'], status: 'Convicted', relatedCase: '2018-0789', notes: 'Shoplifting from tourist vendor. First offense. Community service completed.' }
  ],

  // ========== BOLOs (Be On the Lookout) ==========
  bolos: [
    { id: 1, boloNum: 'BOLO-2024-0001', type: 'Vehicle', issuedDate: '2024-02-22', issuedBy: 'Det. Morrison', status: 'Active', priority: 'High', plate: 'SSB-2200', vehicleDesc: '1998 Albany Buccaneer, Red, Custom Rims, Tinted Windows', suspectDesc: null, citizenId: 3, citizenName: 'Viktor Kozlov', relatedCase: '2024-0156', notes: 'Vehicle associated with South Side robbery. Owner has outstanding warrants.' },
    { id: 2, boloNum: 'BOLO-2024-0002', type: 'Person', issuedDate: '2024-03-15', issuedBy: 'Det. Stone', status: 'Active', priority: 'Critical', plate: null, vehicleDesc: null, suspectDesc: 'Male, approximately 6ft, medium build. Last seen wearing black hoodie and ski mask.', citizenId: null, citizenName: 'Unknown', relatedCase: '2024-0289', notes: 'Armed robbery suspect. Considered armed and dangerous. Weapon: handgun.' },
    { id: 3, boloNum: 'BOLO-2024-0003', type: 'Person', issuedDate: '2024-04-02', issuedBy: 'Det. Vasquez', status: 'Active', priority: 'Medium', plate: null, vehicleDesc: null, suspectDesc: 'Female, 24 years old, 5\'6", blonde hair, last seen wearing blue dress.', citizenId: null, citizenName: 'Jessica Lane', relatedCase: '2024-0412', notes: 'Missing person. Last seen Mirror Hills area. No foul play suspected but welfare check requested.' },
    { id: 4, boloNum: 'BOLO-2024-0004', type: 'Vehicle', issuedDate: '2024-04-25', issuedBy: 'Ofc. Taylor', status: 'Active', priority: 'Low', plate: 'VWH-1800', vehicleDesc: '2023 Obey Tailgater, Gray', suspectDesc: null, citizenId: 9, citizenName: 'Tyler Reed', relatedCase: null, notes: 'Vehicle registration suspended. Multiple unpaid citations. Stop and cite if observed.' },
    { id: 5, boloNum: 'BOLO-2024-0005', type: 'Weapon', issuedDate: '2024-02-10', issuedBy: 'Det. Park', status: 'Active', priority: 'High', plate: null, vehicleDesc: null, suspectDesc: 'Hawk & Little Pistol .50, Serial: WPN-00004', citizenId: null, citizenName: null, relatedCase: '2024-0892', notes: 'Stolen firearm. If recovered, secure and notify Det. Park immediately.' }
  ],

  // ========== SCANNER PHOTOS (template evidence) ==========
  // Used by Arrest Live Editor → EVIDENCE → Scanner Photos tab.
  // These are just seed placeholders and should point to local assets.
  scannerPhotos: [
    { id: 1, label: 'Traffic Cam Still — Neon Core Ave', src: './FINAL ROADS.webp', takenAt: '2024-03-22 16:51', takenBy: 'Scanner Unit', tags: ['traffic','street'] },
    { id: 2, label: 'Aerial Sweep — Harbor Perimeter', src: './FINAL OCEAN.webp', takenAt: '2024-04-15 02:21', takenBy: 'Scanner Unit', tags: ['aerial','ports'] },
    { id: 3, label: 'Zone Snapshot — South Side', src: './SS2.png', takenAt: '2024-04-15 02:24', takenBy: 'Scanner Unit', tags: ['zone','south-side'] },
    { id: 4, label: 'Zone Snapshot — Downtown Core', src: './NEON_CORE.png', takenAt: '2024-01-15 14:39', takenBy: 'Scanner Unit', tags: ['zone','downtown'] },
    { id: 5, label: 'Checkpoint Capture — Ports Gate', src: './NEON_CITY_PORTS.png', takenAt: '2024-02-22 08:11', takenBy: 'Scanner Unit', tags: ['checkpoint','ports'] },
    { id: 6, label: 'Restricted Scan — APEX HQ Exterior', src: './APEX_HQ.png', takenAt: '2024-04-20 20:55', takenBy: 'Scanner Unit', tags: ['restricted','apex'] },
    { id: 7, label: 'Restricted Scan — Merryweather Base', src: './MERRYWEATHER_BASE.png', takenAt: '2024-04-20 21:01', takenBy: 'Scanner Unit', tags: ['restricted','merryweather'] },
    { id: 8, label: 'Facility Scan — Humane Labs Access Road', src: './HUMANE_LABS.png', takenAt: '2024-04-12 10:18', takenBy: 'Scanner Unit', tags: ['facility','labs'] },
    { id: 9, label: 'Neighborhood Scan — Little Seoul Plaza', src: './LITTLE_SEOUL.png', takenAt: '2024-01-28 03:08', takenBy: 'Scanner Unit', tags: ['neighborhood'] },
    { id: 10, label: 'Neighborhood Scan — Mirror Hills', src: './MIRROR_HILLS.png', takenAt: '2024-04-02 09:54', takenBy: 'Scanner Unit', tags: ['neighborhood'] },
    { id: 11, label: 'Neighborhood Scan — Rockford Hills', src: './ROCKFORD_HILLS.png', takenAt: '2024-04-28 01:03', takenBy: 'Scanner Unit', tags: ['neighborhood'] },
    { id: 12, label: 'Facility Scan — Prison Exterior', src: './NEON_CITY_PRISON.png', takenAt: '2024-04-25 11:10', takenBy: 'Scanner Unit', tags: ['facility','prison'] },
  ],

  // ========== AMBULANCE CALLS (for Medical mode) ==========
  ambulanceCalls: [
    { id: 1, callNum: 'EMS-2024-0001', date: '2024-01-10', time: '08:15', location: '2200 South Side Blvd', patientId: 3, patientName: 'Viktor Kozlov', priority: 'Code 2', nature: 'Laceration - hand injury', dispatchedUnit: 'Medic 7', facility: 'Pillbox Hill Medical', outcome: 'Transported', notes: 'Patient left AMA after initial treatment.' },
    { id: 2, callNum: 'EMS-2024-0034', date: '2024-02-14', time: '23:52', location: 'The Neon Lounge, Vespucci', patientId: null, patientName: 'John Doe', priority: 'Code 3', nature: 'Assault victim - facial trauma', dispatchedUnit: 'Medic 3', facility: 'Pillbox Hill Medical', outcome: 'Transported', notes: 'NCPD on scene. Related to Case #2024-0102.' },
    { id: 3, callNum: 'EMS-2024-0056', date: '2024-02-28', time: '19:30', location: '445 Vespucci Beach Rd', patientId: 4, patientName: 'Elena Vasquez', priority: 'Code 2', nature: 'Respiratory distress - asthma', dispatchedUnit: 'Medic 5', facility: 'Central Los Santos Medical', outcome: 'Transported', notes: 'Patient responsive. Nebulizer administered en route.' },
    { id: 4, callNum: 'EMS-2024-0099', date: '2024-04-05', time: '14:20', location: '600 Palomino Lands Ranch', patientId: 10, patientName: 'Nina Petrov', priority: 'Code 3', nature: 'Allergic reaction - anaphylaxis', dispatchedUnit: 'Medic 12', facility: 'Sandy Shores Medical', outcome: 'Transported', notes: 'Patient self-administered EpiPen prior to arrival. Stable on transport.' },
    { id: 5, callNum: 'EMS-2024-0112', date: '2024-04-12', time: '22:45', location: '1800 Vinewood Hills Rd', patientId: 9, patientName: 'Tyler Reed', priority: 'Code 2', nature: 'Anxiety attack / Psychiatric', dispatchedUnit: 'Medic 2', facility: 'Central Los Santos Medical', outcome: 'Transported', notes: 'Patient cooperative. No physical injuries. Counseling referral provided.' },
    { id: 6, callNum: 'EMS-2024-0078', date: '2024-03-10', time: '10:00', location: 'VA Medical Center', patientId: 7, patientName: 'Derek Stone', priority: 'Scheduled', nature: 'Psychiatric evaluation - PTSD followup', dispatchedUnit: 'N/A', facility: 'VA Medical Center', outcome: 'Completed', notes: 'Scheduled appointment. Patient stable.' },
    { id: 7, callNum: 'EMS-2024-0134', date: '2024-04-20', time: '11:30', location: '320 La Puerta St', patientId: 8, patientName: 'Maria Santos', priority: 'Code 2', nature: 'Chemical burn - occupational', dispatchedUnit: 'Medic 9', facility: 'Pillbox Hill Medical', outcome: 'Transported', notes: 'Workplace injury at auto shop. Hand irrigated on scene.' },
    { id: 8, callNum: 'EMS-2024-0150', date: '2024-04-15', time: '02:45', location: 'Warehouse 12, Neon City Ports', patientId: null, patientName: 'Unknown Male', priority: 'Code 3', nature: 'GSW - DOA', dispatchedUnit: 'Medic 1', facility: 'Pillbox Hill Medical', outcome: 'DOA', notes: 'Coroner dispatched. NCPD Homicide on scene. Case #2024-0501.' }
  ],

  // ========== CITY PERMITS (for City Council mode) ==========
  cityPermits: [
    { id: 1, permitNum: 'BP-2024-0089', type: 'Building', applicant: 'Morrison Industries', location: '1200 Rockford Hills Estate', issuedDate: '2024-01-20', expiryDate: '2025-01-20', status: 'Active', inspector: 'J. Thompson', notes: 'Pool house addition. Approved with conditions.' },
    { id: 2, permitNum: 'BL-2024-0034', type: 'Business License', applicant: 'Yuki Tanaka', location: '78 Little Seoul Plaza', issuedDate: '2024-01-15', expiryDate: '2025-01-15', status: 'Active', inspector: null, notes: 'Tanaka Ramen - Food service establishment.' },
    { id: 3, permitNum: 'BL-2024-0078', type: 'Business License', applicant: 'Maria Santos', location: '320 La Puerta St', issuedDate: '2024-02-01', expiryDate: '2025-02-01', status: 'Active', inspector: null, notes: 'Santos Auto Repair - Automotive services.' },
    { id: 4, permitNum: 'LL-2024-0145', type: 'Liquor License', applicant: 'NL Entertainment LLC', location: 'The Neon Lounge, Vespucci', issuedDate: '2024-04-10', expiryDate: '2025-04-10', status: 'Active', inspector: 'R. Davis', notes: 'Annual renewal approved. No violations.' },
    { id: 5, permitNum: 'DP-2024-0123', type: 'Demolition', applicant: 'Urban Renewal LLC', location: '1500 South Side Industrial', issuedDate: '2024-03-28', expiryDate: '2024-09-28', status: 'Active', inspector: 'M. Garcia', notes: 'Condemned warehouse. Asbestos abatement required.' },
    { id: 6, permitNum: 'HB-2024-0056', type: 'Home Business', applicant: 'Elena Vasquez', location: '445 Vespucci Beach Rd', issuedDate: null, expiryDate: null, status: 'Denied', inspector: 'K. Brown', notes: 'Application denied due to zoning restrictions.' }
  ],

  // ========== TAX RECORDS (for City Council mode) ==========
  taxRecords: [
    { id: 1, taxId: 'TAX-2024-0001', propertyId: 3, address: '2200 South Side Blvd', owner: 'South Side Properties LLC', assessedValue: '₡180,000', taxDue: '₡4,500', taxPaid: '₡0', status: 'Delinquent', dueDate: '2024-03-01', notes: 'Multiple notices sent. Lien proceedings initiated.' },
    { id: 2, taxId: 'TAX-2024-0002', propertyId: 5, address: '1200 Rockford Hills Estate', owner: 'Morrison Industries', assessedValue: '₡12,500,000', taxDue: '₡312,500', taxPaid: '₡312,500', status: 'Paid', dueDate: '2024-03-01', notes: 'Paid in full.' },
    { id: 3, taxId: 'TAX-2024-0003', propertyId: 6, address: '78 Little Seoul Plaza', owner: 'Yuki Tanaka', assessedValue: '₡920,000', taxDue: '₡23,000', taxPaid: '₡23,000', status: 'Paid', dueDate: '2024-03-01', notes: 'Commercial property tax paid.' },
    { id: 4, taxId: 'TAX-2024-0004', propertyId: 8, address: '320 La Puerta St', owner: 'Santos Auto LLC', assessedValue: '₡540,000', taxDue: '₡13,500', taxPaid: '₡13,500', status: 'Paid', dueDate: '2024-03-01', notes: 'Mixed use commercial/residential.' },
    { id: 5, taxId: 'TAX-2024-0005', propertyId: 9, address: 'Warehouse 7, Neon City Ports', owner: 'SecuroServ Holdings', assessedValue: '₡3,200,000', taxDue: '₡80,000', taxPaid: '₡80,000', status: 'Paid', dueDate: '2024-03-01', notes: 'Industrial zone. RESTRICTED access.' }
  ],

  // ========== CODE VIOLATIONS (for City Council mode) ==========
  codeViolations: [
    { id: 1, violationNum: 'CV-2024-0001', type: 'Zoning', location: '320 La Puerta St', reportedDate: '2024-01-05', reportedBy: 'Anonymous', status: 'Resolved', fine: '₡500', notes: 'Operating outside permitted hours. Warning issued, compliance achieved.' },
    { id: 2, violationNum: 'CV-2024-0012', type: 'Noise', location: '2200 South Side Blvd', reportedDate: '2024-02-15', reportedBy: 'Multiple Residents', status: 'Ongoing', fine: '₡1,000', notes: 'Repeated noise complaints. Multiple warnings. Fine issued.' },
    { id: 3, violationNum: 'CV-2024-0034', type: 'Health', location: '78 Little Seoul Plaza', reportedDate: '2024-02-02', reportedBy: 'Routine Inspection', status: 'Resolved', fine: '₡0', notes: 'Minor issues corrected during inspection. No fine.' },
    { id: 4, violationNum: 'CV-2024-0056', type: 'Environmental', location: 'Neon City Ports', reportedDate: '2024-03-08', reportedBy: 'Green NC Coalition', status: 'Under Investigation', fine: 'TBD', notes: 'Alleged chemical dumping. EPA investigation ongoing.' },
    { id: 5, violationNum: 'CV-2024-0078', type: 'Building', location: '1500 South Side Industrial', reportedDate: '2024-01-15', reportedBy: 'City Inspector', status: 'Condemned', fine: 'N/A', notes: 'Structural failure. Building condemned. Demolition scheduled.' }
  ],
};

/**
 * Search helper - searches array by ID or text fields
 */
window.mdtSearch = function(dataKey, query) {
  var base = (window.MDT_DATA && window.MDT_DATA[dataKey]) ? window.MDT_DATA[dataKey] : [];
  var runtime = window.MDT_DATA_RUNTIME || {};
  var created = (runtime.created && runtime.created[dataKey] && Array.isArray(runtime.created[dataKey])) ? runtime.created[dataKey] : [];
  var updated = (runtime.updated && runtime.updated[dataKey] && typeof runtime.updated[dataKey] === 'object') ? runtime.updated[dataKey] : {};

  function applyUpdated(item){
    if(!item) return item;
    var id = item.id;
    var patch = (id != null && updated && updated[id]) ? updated[id] : null;
    if(!patch) return item;
    var merged = {};
    for(var k in item){ merged[k] = item[k]; }
    for(var k2 in patch){ merged[k2] = patch[k2]; }
    return merged;
  }

  var data = [];
  for(var i=0;i<base.length;i++) data.push(applyUpdated(base[i]));
  for(var j=0;j<created.length;j++) data.push(applyUpdated(created[j]));

  var q = String(query || '').trim().toLowerCase();
  if(!q) return data.slice(0, 20);

  var numQuery = parseInt(q, 10);
  if(!isNaN(numQuery)){
    for(var x=0;x<data.length;x++){
      if(data[x] && data[x].id === numQuery) return [data[x]];
    }
  }

  function arrayIncludes(arr, needle){
    for(var a=0;a<arr.length;a++){
      if(String(arr[a]).toLowerCase().indexOf(needle) !== -1) return true;
    }
    return false;
  }

  var out = [];
  for(var r=0;r<data.length;r++){
    var item = data[r];
    if(!item) continue;

    var vals = Object.values ? Object.values(item) : (function(o){ var res=[]; for(var kk in o) res.push(o[kk]); return res; })(item);
    var match = false;
    for(var v=0; v<vals.length; v++){
      var val = vals[v];
      if(typeof val === 'string'){
        if(val.toLowerCase().indexOf(q) !== -1){ match = true; break; }
      }else if(Array.isArray(val)){
        if(arrayIncludes(val, q)){ match = true; break; }
      }
    }

    if(match) out.push(item);
  }
  return out;
};
