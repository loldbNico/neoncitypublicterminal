/**
 * Penal Code dataset
 *
 * Source format from user: c(name, severity, description, group, timeMonths, fineDollars)
 * - Group is intentionally ignored by MDT.
 * - UTILITY charges are intentionally excluded.
 * - Jail time is stored/shown as *max months only*.
 * - HUT / life values use the infinity symbol (∞).
 */

(function () {
  if (!window.MDT_DATA) window.MDT_DATA = {};

  const pad3 = (n) => String(n).padStart(3, '0');
  const money = (n) => '₡' + Math.round(Number(n) || 0).toLocaleString('en-US');

  // Keep this small helper to make the dataset readable.
  function c(title, category, description, _groupIgnored, timeMonths, fineDollars) {
    return {
      title,
      category,
      description,
      timeMonths,
      fineDollars,
    };
  }

  const HUT_SENTINEL = 999999999;

  const charges = [
    /* === INFRACTIONS === */
    c(
      'Distracted Driving',
      'Infraction',
      'Suspect operated a motor vehicle while engaging in a non-driving activity that significantly impairs attention or control of the vehicle.',
      'Traffic & Vehicle',
      0,
      300
    ),
    c(
      'Driving without a Valid License',
      'Infraction',
      'Suspect found operating a motor vehicle without a valid physical license in their possession.',
      'Traffic & Vehicle',
      0,
      250
    ),
    c(
      'Failure to Display License Plate',
      'Infraction',
      "Suspect's vehicle was found to be parked next to, or operated upon State's paved roadway without visible and accurate license plate.",
      'Traffic & Vehicle',
      0,
      150
    ),
    c(
      'Failure to Maintain Lane',
      'Infraction',
      'Suspect failed to operate a vehicle in a proper lane of travel, without lawful justification.',
      'Traffic & Vehicle',
      0,
      100
    ),
    c(
      'Failure to Stop',
      'Infraction',
      'Suspect failed to come to a stop at an appropriate traffic control device or marking.',
      'Traffic & Vehicle',
      0,
      200
    ),
    c(
      'Speeding (3rd Degree)',
      'Infraction',
      'Suspect was found operating a motor vehicle over the posted speed limit.',
      'Traffic & Vehicle',
      0,
      100
    ),
    c(
      'Speeding (2nd Degree)',
      'Infraction',
      'Suspect was found operating a motor vehicle 25 mph or more over the posted speed limit.',
      'Traffic & Vehicle',
      0,
      250
    ),
    c(
      'Speeding (1st Degree)',
      'Infraction',
      'Suspect was found operating a motor vehicle 50 mph or more over the posted speed limit.',
      'Traffic & Vehicle',
      0,
      750
    ),
    c(
      'Illegal Parking',
      'Infraction',
      "Suspect's vehicle was found in violation of State parking code, without lawful justification or falling within the parking exemptions. (Subject to tow)",
      'Traffic & Vehicle',
      0,
      100
    ),
    c(
      'Impeding Traffic',
      'Infraction',
      "Suspect's actions continuously disrupted or stopped the flow of traffic.",
      'Traffic & Vehicle',
      0,
      300
    ),
    c(
      'Negligent Driving',
      'Infraction',
      'Suspect was seen breaking multiple traffic laws, creating unnecessary risk to others\' safety.',
      'Traffic & Vehicle',
      0,
      200
    ),
    c(
      'Passenger Endangerment',
      'Infraction',
      'Suspect knowingly failed to secure their passengers, transporting them in an unsafe fashion or manner.',
      'Traffic & Vehicle',
      0,
      250
    ),
    c(
      'Negligent Ownership of a Firearm',
      'Infraction',
      'Suspect failed to exercise reasonable safety in handling or storing their legally registered firearm, including possession of an expired weapon license.',
      'Weapons',
      0,
      200
    ),
    c(
      'Criminal Threats',
      'Infraction',
      "Suspect made clear and convincing threats against a person's life or safety, causing reasonable fear.",
      'Person & Violent',
      0,
      400
    ),
    c(
      'Loitering on Gov. Property',
      'Infraction',
      'Suspect was found present on Government owned property for an extended period of time without apparent purpose or reason, and refused to leave.',
      'Government & Court',
      0,
      200
    ),
    c(
      'Anti-mask Law',
      'Infraction',
      'Suspect was found obstructing their face while on government ground, without lawful justification.',
      'Government & Court',
      0,
      250
    ),
    c(
      'Disturbing the Peace',
      'Infraction',
      'Suspect acted without lawful justification, in a manner that unreasonably disturbed the public, and refused or failed to cease such actions after being confronted by an LEO.',
      'Person & Violent',
      0,
      500
    ),
    c(
      'Littering',
      'Infraction',
      'Suspect found to be discarding waste outside of a designated area or receptacle.',
      'Other',
      0,
      100
    ),
    c(
      'Misuse of Emergency Systems',
      'Infraction',
      'Suspect knowingly and unlawfully used the emergency line for non-emergency reasons.',
      'Government & Court',
      0,
      500
    ),
    c(
      'Petty Theft',
      'Infraction',
      'Suspect has knowingly and unlawfully taken property of another person or business, valued at below ₡50.',
      'Property & Economic',
      0,
      150
    ),
    c(
      'Unlawful Hunting',
      'Infraction',
      'Suspect failed to comply with hunting rules specified within the public legislation.',
      'Other',
      0,
      250
    ),
    c(
      'Vandalism',
      'Infraction',
      'Suspect willfully and unlawfully caused destruction of private or business property.',
      'Property & Economic',
      0,
      500
    ),
    c(
      'Public Waste Offense',
      'Infraction',
      'Suspect willfully relieved themselves outside of designated restroom facilities, thereby creating a public nuisance, sanitation hazard, or offense to public.',
      'Other',
      0,
      300
    ),

    /* === MISDEMEANORS === */
    c(
      'Driving Under the Influence',
      'Misdemeanor',
      'Suspect was found operating a motor vehicle while under the influence of alcohol (above 0.08% BAC) or a controlled dangerous substance.',
      'Traffic & Vehicle',
      10,
      2000
    ),
    c(
      'Driving with a Suspended License',
      'Misdemeanor',
      'Suspect was found to be operating a motor vehicle while their license was revoked or suspended.',
      'Traffic & Vehicle',
      5,
      350
    ),
    c(
      'Evading',
      'Misdemeanor',
      'Suspect was witnessed fleeing lawful detainment or arrest using a vehicle.',
      'Traffic & Vehicle',
      10,
      1000
    ),
    c(
      'Hit and Run (Property)',
      'Misdemeanor',
      'Suspect has struck property with their vehicle causing damage, and fled the scene without identifying oneself to the present, affected party.',
      'Traffic & Vehicle',
      5,
      500
    ),
    c(
      'Theft of a Motor Vehicle',
      'Misdemeanor',
      "Suspect was found in unlawful possession of a vehicle that's unregistered, or registered to another person.",
      'Traffic & Vehicle',
      10,
      1000
    ),
    c(
      'Possession of a Controlled Substance (Misdemeanor)',
      'Misdemeanor',
      'Suspect was found in possession of a controlled dangerous substance or prescription medication without a valid prescription. (Marijuana – more than 10 joints or 1 baggie.)',
      'Drugs',
      20,
      1500
    ),
    c(
      'Brandishing',
      'Misdemeanor',
      'Suspect intentionally displays a weapon without lawful justification, causing reasonable fear of harm.',
      'Weapons',
      10,
      500
    ),
    c(
      'Criminal Use of a Non-Firearm',
      'Misdemeanor',
      'Suspect used a non-firearm weapon in a commission of a serious crime.',
      'Weapons',
      10,
      500
    ),
    c(
      'Possession of Illegal Firearm Modification',
      'Misdemeanor',
      'Suspect was found in unlawful possession of an illegal firearm attachment or modification.',
      'Weapons',
      5,
      500
    ),
    c(
      'Reckless Use of a Firearm',
      'Misdemeanor',
      'Suspect failed to exercise reasonable safety in handling or use of their legally registered firearm, creating substantial risk to public safety.',
      'Weapons',
      5,
      500
    ),
    c(
      'Aggravated Criminal Threats',
      'Misdemeanor',
      "Suspect made clear and convincing threat against a government employee's life or safety, causing reasonable fear. Victim's occupation was known to the suspect or would be reasonable to conclude.",
      'Person & Violent',
      5,
      500
    ),
    c(
      'Assault',
      'Misdemeanor',
      'Suspect engaged in a physical attack that caused reasonable fear of serious harm or engaged in extremely offensive contact.',
      'Person & Violent',
      10,
      1000
    ),
    c(
      'Battery',
      'Misdemeanor',
      'Suspect engaged in an unlawful physical act resulting in serious injury of another.',
      'Person & Violent',
      30,
      2500
    ),
    c(
      'False Imprisonment',
      'Misdemeanor',
      'Suspect intentionally restrained another’s freedom of movement, without lawful authority, by force, threat, or deception.',
      'Person & Violent',
      25,
      2000
    ),
    c(
      'Harassment',
      'Misdemeanor',
      'Suspect engaged in a course of unwanted contact or communication, without consent and serving no legitimate or lawful purpose, causing unreasonable interference with daily activities.',
      'Person & Violent',
      10,
      1000
    ),
    c(
      'Stalking',
      'Misdemeanor',
      'Suspect was identified to knowingly and repeatedly follow or surveil another person without consent or lawful reason, causing a reasonable fear for their safety.',
      'Person & Violent',
      25,
      2000
    ),
    c(
      'Impersonating a Gov. Employee',
      'Misdemeanor',
      'Suspect presented themselves as a government employee, in a reasonably convincing manner.',
      'Government & Court',
      10,
      500
    ),
    c(
      'Introducing Contraband to a Gov. Facility',
      'Misdemeanor',
      'Suspect introduced contraband to a government facility, including but not limited to; restricted areas of Police Departments, State Prison, City Hall and its Courtroom.',
      'Government & Court',
      25,
      2500
    ),
    c(
      'Possession of Gov. Equipment',
      'Misdemeanor',
      'Suspect was found in unlawful possession of government issued equipment.',
      'Government & Court',
      30,
      3000
    ),
    c(
      'Aggravated Vandalism',
      'Misdemeanor',
      'Suspect willfully and unlawfully caused destruction of state property.',
      'Property & Economic',
      15,
      1500
    ),
    c(
      'Animal Cruelty',
      'Misdemeanor',
      'Suspect knowingly and intentionally partook in actions inflicting unnecessary suffering or pain upon an animal.',
      'Other',
      15,
      1000
    ),
    c(
      'Burglary',
      'Misdemeanor',
      'Suspect entered a private or business property without consent or legal justification, in order to commit a crime.',
      'Property & Economic',
      10,
      1000
    ),
    c(
      'Contempt of Court',
      'Misdemeanor',
      "Suspect engaged in conduct deemed by a judge presiding over a case to be disruptive and unwelcome (Time and fine up to Judge's discretion).",
      'Government & Court',
      HUT_SENTINEL,
      HUT_SENTINEL
    ),
    c(
      'Disobeying a Lawful Order',
      'Misdemeanor',
      'Suspect knowingly fails or refuses to follow a simple, reasonable order issued by a law enforcement officer acting within their lawful authority.',
      'Government & Court',
      5,
      500
    ),
    c(
      'False Reporting',
      'Misdemeanor',
      'Suspect knowingly and unlawfully made a false report of a crime.',
      'Government & Court',
      10,
      1000
    ),
    c(
      'Fraud',
      'Misdemeanor',
      'Suspect used false information or engaged in deceptive conduct with intentions to deceive another for financial gain in either personal or business dealings.',
      'Property & Economic',
      30,
      3000
    ),
    c(
      'Grand Theft',
      'Misdemeanor',
      'Suspect has knowingly and unlawfully taken property of another person or business, without consent, valued at above ₡3000.',
      'Property & Economic',
      30,
      2000
    ),
    c(
      'Interference with Emergency Services',
      'Misdemeanor',
      "Suspect knowingly and intentionally acts in a way that interferes with State's emergency services.",
      'Government & Court',
      15,
      1500
    ),
    c(
      'Malfeasance',
      'Misdemeanor',
      'Suspect was a government employee, and knowingly engaged in an unlawful activity, which did or could result in harm, suppression of rights or general abuse of power. | To be pushed by DAO.',
      'Government & Court',
      10,
      1500
    ),
    c(
      'Obstruction of Justice',
      'Misdemeanor',
      "Suspect knowingly and unlawfully acted in a way that interfered with law enforcement officer's active duty, criminal investigation or a judicial proceeding.",
      'Government & Court',
      20,
      1000
    ),
    c(
      'Possession of Stolen Property',
      'Misdemeanor',
      'Suspect was found in possession of stolen property, with knowledge of its origin or lack of reasonable belief for it to not be such.',
      'Property & Economic',
      20,
      2000
    ),
    c(
      'Reckless Endangerment',
      'Misdemeanor',
      'Suspect knowingly and with no lawful justification engaged in conduct that created substantial risk of injury or death to others.',
      'Other',
      10,
      1000
    ),
    c(
      'Resisting Arrest',
      'Misdemeanor',
      'Suspect engaged in physical actions to avoid lawful detainment.',
      'Government & Court',
      10,
      500
    ),
    c(
      'Robbery',
      'Misdemeanor',
      'Suspect used threats of harm or force against another person or business for financial or personal gain.',
      'Property & Economic',
      25,
      1000
    ),
    c(
      'Theft',
      'Misdemeanor',
      'Suspect has knowingly and unlawfully taken property of another person or business, without consent, valued at between ₡50 and ₡3000.',
      'Property & Economic',
      10,
      1000
    ),
    c(
      'Trespassing',
      'Misdemeanor',
      'Suspect knowingly entered a clearly restricted property, or failed to leave a property upon notice from a party authorized by the owner.',
      'Property & Economic',
      10,
      500
    ),
    c(
      'Vehicle Tampering',
      'Misdemeanor',
      "Suspect deliberately interfered with normal functions of a vehicle, creating potential for operator's injury as results of their actions.",
      'Traffic & Vehicle',
      15,
      1500
    ),
    c(
      'Vigilantism',
      'Misdemeanor',
      'Suspect acted in the scope of law enforcement duties without proper legal authority to do so.',
      'Government & Court',
      25,
      1000
    ),
    c(
      'Indecent Exposure',
      'Misdemeanor',
      'Suspect willlfully exposed their genitals or engaged in lewd display of their body in a public area, causing offense or alarm to another.',
      'Person & Violent',
      10,
      500
    ),
    c(
      'Public Intoxication',
      'Misdemeanor',
      'Suspect was found under the influence of alcohol or controlled substance while unreasonably disturbing the peace, or presenting danger to themselves or others.',
      'Person & Violent',
      15,
      500
    ),
    c(
      'Unlawful Assembly',
      'Misdemeanor',
      'Suspect was found gathered with others in a public place in a manner that created danger of disorder or violence, and refused to disperse upon lawful order.',
      'Person & Violent',
      10,
      1000
    ),
    c(
      'False Identification',
      'Misdemeanor',
      'Suspect purposefully provided false or misleading identification when lawfully required to identify.',
      'Government & Court',
      10,
      1000
    ),
    c(
      'Failure to Appear',
      'Misdemeanor',
      'Suspect unreasonably failed to appear in court or at a scheduled legal proceeding as required by lawful order or summons.',
      'Government & Court',
      20,
      2500
    ),
    c(
      'Possession of Marked Currency',
      'Misdemeanor',
      'Suspect was found in possession of up to ₡3,000 in marked or illicit currency.',
      'Property & Economic',
      10,
      1000
    ),

    /* === FELONIES === */
    c(
      'Aggravated Theft of a Motor Vehicle',
      'Felony',
      'Suspect found in unlawful possession of a government agency owned vehicle, or engaged in the act of stealing a vehicle involving a deadly weapon.',
      'Traffic & Vehicle',
      30,
      2500
    ),
    c(
      'Grand Theft Auto',
      'Felony',
      'Suspect found in possession of a stolen vehicle, having taken unlawful actions designed to permanently deprive the vehicle owner of its custody.',
      'Traffic & Vehicle',
      40,
      2500
    ),
    c(
      'Hit and Run (Person)',
      'Felony',
      'Suspect has struck person(s) with their vehicle, causing bodily harm, and fled the scene without identifying oneself to the present, affected party.',
      'Traffic & Vehicle',
      30,
      1500
    ),
    c(
      'Possession of a Controlled Substance (Felony)',
      'Felony',
      'Suspect was found in possession of a controlled dangerous substance or prescription medication without a valid prescription. (Marijuana – more than 50 joints or 5 baggies. | More than 5 baggies of any other controlled dangerous substance. | More than 5 bottles of prescription medication.)',
      'Drugs',
      40,
      3000
    ),
    c(
      'Manufacturing of Controlled Substance',
      'Felony',
      'Suspect was found engaging in cultivation or manufacturing of a controlled dangerous substance, without lawful reason or proper state-issued license.',
      'Drugs',
      50,
      4000
    ),
    c(
      'Sale of Controlled Substance',
      'Felony',
      'Suspect engaged in the unlawful sale or exchange of controlled dangerous substances or prescription medication. The suspect did not have a proper license to sell controlled or prescribed substances.',
      'Drugs',
      30,
      2500
    ),
    c(
      'Money Laundering',
      'Felony',
      'Suspect was found in possession of more than ₡3,000 in marked or illicit currency, or engaged in financial transactions intended to conceal or legitimize proceeds of personal unlawful activity.',
      'Property & Economic',
      30,
      3000
    ),
    c(
      'Criminal Distribution of Firearm',
      'Felony',
      'Suspect knowingly distributed ownership of a firearm without lawful permission from the State.',
      'Weapons',
      20,
      1500
    ),
    c(
      'Criminal Use of Illegal Explosives',
      'Felony',
      'Suspect unlawfully used a lethal explosive material or device designed to cause harm or mass-destruction.',
      'Weapons',
      50,
      5000
    ),
    c(
      'Criminal Use of a Firearm',
      'Felony',
      'Suspect used a firearm, regardless of legal ownership, in a commission of a serious crime.',
      'Weapons',
      15,
      1000
    ),
    c(
      'Possession of Illegal Explosives',
      'Felony',
      'Suspect was found in unlawful possession of lethal explosive material or device designed to cause harm or mass-destruction.',
      'Weapons',
      30,
      3000
    ),
    c(
      'Possession of an Illegal Firearm (Class-1)',
      'Felony',
      'Suspect was found in unlawful possession of a an improperly registered, self-manufactured, or stolen class-1 firearm(s). | Up to 5 firearms per charge.',
      'Weapons',
      10,
      1000
    ),
    c(
      'Possession of an Illegal Firearm (Class-2)',
      'Felony',
      'Suspect was found in unlawful possession of a an improperly registered, self-manufactured, or stolen class-2 firearm(s). | Up to 5 firearms per charge.',
      'Weapons',
      20,
      2000
    ),
    c(
      'Possession of an Illegal Firearm (Class-3)',
      'Felony',
      'Suspect was found in unlawful possession of a an improperly registered, self-manufactured, or stolen class-3 firearm(s). | Up to 5 firearms per charge.',
      'Weapons',
      40,
      4000
    ),
    c(
      'Unlawful Wiretapping',
      'Felony',
      'Suspect was found unlawfully intercepting or monitoring communications through technical means, such as tapping phone lines, planting listening devices, or accessing private communications without; being a party to the conversation, having consent of the party, or lawful authority.',
      'Government & Court',
      40,
      3000
    ),
    c(
      'Aggravated Assault',
      'Felony',
      "Suspect engaged in a physical act using a deadly weapon that caused reasonable fear of serious harm, or committed assault against a government employee who's occupation was known to the suspect or would be reasonable to conclude.",
      'Person & Violent',
      25,
      2000
    ),
    c(
      'Aggravated Battery',
      'Felony',
      "Suspect engaged in an unlawful physical act resulting in serious injury of a government employee who's occupation was known to the suspect or would be reasonable to conclude, or engaged in battery using a deadly weapon.",
      'Person & Violent',
      50,
      4000
    ),
    c(
      'Aggravated False Imprisonment',
      'Felony',
      'Suspect intentionally restrained government employee’s freedom of movement, without lawful authority, by force, threat, or deception.',
      'Person & Violent',
      35,
      2500
    ),
    c(
      'Aggravated Hostage Taking',
      'Felony',
      "Suspect intentionally restrained government employee’s freedom of movement, without lawful authority, by force, threat, or deception, for ransom or hostage use, facilitation of another felony, or to obstruct law enforcement. Victim's occupation was known to the suspect or would be reasonable to conclude.",
      'Person & Violent',
      40,
      3000
    ),
    c(
      'Aggravated Kidnapping',
      'Felony',
      "Suspect intentionally restrained government employee’s freedom of movement, without lawful authority, by force, threat, or deception, and moves them a substantial distance or confines them in a place of isolation. Victim's occupation was known to the suspect or would be reasonable to conclude.",
      'Person & Violent',
      30,
      3000
    ),
    c(
      'Attempted 1st Degree Murder',
      'Felony',
      "Suspect engaged in intentional and unlawful acts clearly designed to end one's life, with prior planning and premeditation.",
      'Person & Violent',
      100,
      8000
    ),
    c(
      'Attempted 2nd Degree Murder',
      'Felony',
      "Suspect engaged in intentional and unlawful acts clearly designed to end one's life, without planning or premeditation.",
      'Person & Violent',
      50,
      4000
    ),
    c(
      'Attempted Murder of a Gov. Employee',
      'Felony',
      "Suspect engaged in intentional and unlawful acts clearly designed to end one's life against a government employee who's occupation was known to the suspect or would be reasonable to conclude.",
      'Person & Violent',
      65,
      5000
    ),
    c(
      'Extortion',
      'Felony',
      'Suspect used threats of harm or force against another person for substantial personal gain, other than theft of property.',
      'Property & Economic',
      40,
      3000
    ),
    c(
      'Hostage Taking',
      'Felony',
      'Suspect intentionally restrained another’s freedom of movement, without lawful authority, by force, threat, or deception, for ransom or hostage use, facilitation of another felony, or to obstruct law enforcement.',
      'Person & Violent',
      30,
      2000
    ),
    c(
      'Involuntary Manslaughter',
      'Felony',
      "Suspect engaged in acts of gross negligence or disregard for other's safety and life, directly resulting in a death of another.",
      'Person & Violent',
      150,
      7000
    ),
    c(
      'Kidnapping',
      'Felony',
      'Suspect intentionally restrained another’s freedom of movement, without lawful authority, by force, threat, or deception, and moves them a substantial distance or confines them in a place of isolation.',
      'Person & Violent',
      20,
      2000
    ),
    c(
      'Aggravated Burglary',
      'Felony',
      'Suspect entered a government property, financial institution or occupied dwelling without consent or legal justification, in order to commit a crime.',
      'Property & Economic',
      30,
      3000
    ),
    c(
      'Aggravated Interference with Emergency Services',
      'Felony',
      "Suspect knowingly and intentionally acts in a way that interferes with State's emergency services, using deadly force or threats of thereof.",
      'Government & Court',
      50,
      5000
    ),
    c(
      'Aggravated Malfeasance',
      'Felony',
      'Suspect was a government employee, and repeatedly engaged in an unlawful activity, which did or could result in harm, suppression of rights or general abuse of power. | To be pushed by DAO.',
      'Government & Court',
      25,
      2500
    ),
    c(
      'Aggravated Obstruction of Justice',
      'Felony',
      "Suspect knowingly and unlawfully acted in a way that interfered with law enforcement officer's active duty, criminal investigation or a judicial proceeding, using deadly force or threats of thereof.",
      'Government & Court',
      40,
      3000
    ),
    c(
      'Aggravated Trespassing',
      'Felony',
      'Suspect knowingly entered a property while an active and served trespass order for said property has been filed.',
      'Property & Economic',
      40,
      2000
    ),
    c(
      'Arson',
      'Felony',
      'Suspect engaged in unlawful and deliberate actions through use of fire in order to cause harm or destroy property.',
      'Property & Economic',
      35,
      3000
    ),
    c(
      'Blackmail',
      'Felony',
      "Suspect used threats of exposing private, damaging information against another person for personal or financial gain, regardless of information's truthfulness.",
      'Property & Economic',
      35,
      2000
    ),
    c(
      'Bribery',
      'Felony',
      'Suspect used a serious offer of personal of financial gain in order to gain favor or preferential treatment from a government employee, within scope of their official duties.',
      'Government & Court',
      25,
      1500
    ),
    c(
      'Conspiracy',
      'Felony',
      'Suspect has successfully joined with at least one other to form a plan of violating the law, and acted upon said plan.',
      'Government & Court',
      10,
      1000
    ),
    c(
      'Desecration of a Corpse',
      'Felony',
      'Suspect knowingly engaged in unlawful actions involving moving, damaging, or otherwise disturbing a diseased individual.',
      'Other',
      100,
      4000
    ),
    c(
      'Escaping Custody',
      'Felony',
      'Suspect escaped custody of law enforcement, prior to full incarceration.',
      'Government & Court',
      30,
      2000
    ),
    c(
      'Evidence Tampering',
      'Felony',
      'Suspect unlawfully and directly concealed, removed, transported or tampered with evidence of a crime that could be used by law enforcement or the court to detain, arrest, or prosecute a person(s).',
      'Government & Court',
      25,
      2000
    ),
    c(
      'Gang Related Violence',
      'Felony',
      'Suspect knowingly and willingly engaged in an unlawful deadly exchange between opposing criminal factions.',
      'Person & Violent',
      30,
      2000
    ),
    c(
      'Grand Robbery',
      'Felony',
      'Suspect used threats of harm or force against government agency or financial institution for financial or personal gain.',
      'Property & Economic',
      40,
      3000
    ),
    c(
      'Inciting a Riot',
      'Felony',
      'Suspect intentionally urged, commanded, or aided a group to engage in violent, unlawful conduct, creating substantial risk of injury or property damage in the state.',
      'Government & Court',
      40,
      2500
    ),
    c(
      'Malpractice',
      'Felony',
      "Suspect acted within a licensed, certified, or otherwise State authorized profession, and through gross negligence, reckless disregard, or willful misconduct created unreasonable risk of harm, resulting in serious injury or serious violation of one's rights.",
      'Government & Court',
      30,
      3000
    ),
    c(
      'Perjury',
      'Felony',
      'Suspect made verifiably false statement on the witness stand, while under oath.',
      'Government & Court',
      50,
      5000
    ),
    c(
      'Street Racing',
      'Felony',
      'Suspect was found participating in an unlawful speed or performance contest of motor vehicles, without proper permission from the State officials.',
      'Traffic & Vehicle',
      30,
      3000
    ),
    c(
      'Theft of an Aircraft',
      'Felony',
      "Suspect found in unlawful possession of an aircraft that's unregistered, or registered to another, without owner's explicit consent.",
      'Traffic & Vehicle',
      40,
      3000
    ),
    c(
      'Torture',
      'Felony',
      'Suspect was engaged in acts of non-consequential violence or psychological torment aimed at another individual with goals of extracting information, personal gain, or personal enjoyment. Acts exceeded the definition of battery.',
      'Person & Violent',
      75,
      5000
    ),
    c(
      'Unlawful Practice',
      'Felony',
      'Suspect acted within a licensed profession without proper licensing or permission from the State.',
      'Government & Court',
      25,
      2000
    ),
    c(
      'Violation of a Restraining Order',
      'Felony',
      'Suspect engaged in actions specifically prohibited by a successfully filed, ruled and served court-ordered documentation, without lawful justification.',
      'Government & Court',
      60,
      2000
    ),
    c(
      'Witness Tampering',
      'Felony',
      'Suspect used threat, force or deception in order to affect actions taken by a party involved in a court proceeding.',
      'Government & Court',
      80,
      3000
    ),
    c(
      'Cybercrime',
      'Felony',
      'Suspect was found unlawfully accessing, manipulating, or disrupting a computer system, network, or electronic data without authorization, for personal gain or to cause harm.',
      'Government & Court',
      30,
      2000
    ),
    c(
      'Disrupting a Scheduled Court Case',
      'Felony',
      'Suspect disrupted a scheduled court proceeding through force or threats thereof, or through repeated behavior which was ordered to cease by an officer of the court.',
      'Government & Court',
      60,
      5000
    ),
    c(
      'Failure to Comply with a Court Order',
      'Felony',
      'Suspect willfully failed to comply with an official, lawful court order issued as part of official court proceeding.',
      'Government & Court',
      50,
      5000
    ),

    /* === FELONY (HUT) === */
    c(
      '2nd Degree Murder',
      'Felony (HUT)',
      "Suspect engaged in intentional and unlawful acts clearly designed to end one's life, without planning or premeditation, resulting in a death of another.",
      'Person & Violent',
      HUT_SENTINEL,
      HUT_SENTINEL
    ),
    c(
      'Aggravated Embezzlement',
      'Felony (HUT)',
      'Suspect used trusted access to steal or misappropriate funds of a public institution or state agency.',
      'Property & Economic',
      HUT_SENTINEL,
      HUT_SENTINEL
    ),
    c(
      'Drug Trafficking',
      'Felony (HUT)',
      'Suspect was found transporting or in possession of a large quantity of controlled dangerous substance. | Marijuana - more than 100 joints/grams. | Cocaine -more than 50 grams. | Meth - more than 50 grams | XTC - more than 50 grams | MDMA - more than 50 grams.',
      'Drugs',
      HUT_SENTINEL,
      HUT_SENTINEL
    ),
    c(
      'Weapon Trafficking',
      'Felony (HUT)',
      'Suspect was found transporting or in possession of a large quantity (over 20) of improperly registered, self-manufactured, or stolen weapons (firearms and illegal explosives).',
      'Weapons',
      HUT_SENTINEL,
      HUT_SENTINEL
    ),
    c(
      '1st Degree Murder',
      'Felony (HUT)',
      "Suspect engaged in intentional and unlawful acts clearly designed to end one's life, with prior planning and premeditation, resulting in a death of another.",
      'Person & Violent',
      HUT_SENTINEL,
      HUT_SENTINEL
    ),
    c(
      'Murder of a Gov. Employee',
      'Felony (HUT)',
      "Suspect engaged in intentional and unlawful acts clearly designed to end one's life against a government employee who's occupation was known to the suspect or would be reasonable to conclude, resulting in a death of another.",
      'Person & Violent',
      HUT_SENTINEL,
      HUT_SENTINEL
    ),
    c(
      'Gov. Corruption',
      'Felony (HUT)',
      'Suspect either abused their own position as state official, or manipulated/coerced a state official in order to obtain personal, financial or political gain.',
      'Government & Court',
      HUT_SENTINEL,
      HUT_SENTINEL
    ),
    c(
      'Insurrection',
      'Felony (HUT)',
      'Suspect used violence or threat of thereof in order to overthrow the executive branch of the government.',
      'Government & Court',
      HUT_SENTINEL,
      HUT_SENTINEL
    ),
    c(
      'Jailbreak',
      'Felony (HUT)',
      'Suspect escaped custody of law enforcement while being held in the confines of the state prison.',
      'Government & Court',
      HUT_SENTINEL,
      HUT_SENTINEL
    ),
    c(
      'Mayhem',
      'Felony (HUT)',
      'Suspect engaged in repeated torture of individual or group of individuals. The acts must have been spread over multiple days. Acts must have been taken within a 21 days window.',
      'Person & Violent',
      HUT_SENTINEL,
      HUT_SENTINEL
    ),
    c(
      'Human Trafficking',
      'Felony (HUT)',
      'Suspect was found unlawfully kidnapping or transporting five (5) or more individuals through force, threat, or deception for the purpose of exploitation or personal gain.',
      'Person & Violent',
      HUT_SENTINEL,
      HUT_SENTINEL
    ),
    c(
      'Aggravated Torture',
      'Felony (HUT)',
      'Suspect was engaged in unlawful acts of extreme violence, mutilation, or psychological torment aimed at another individual. Acts resulted in severe and long-lasting damage to the victim, including permanent disfigurement, organ removal, or other grievous bodily or psychological harm well beyond the scope of battery.',
      'Person & Violent',
      HUT_SENTINEL,
      HUT_SENTINEL
    ),
    c(
      'Terrorism',
      'Felony (HUT)',
      'Suspect engaged or planned acts of deadly violence or extreme intimidation intending to influence the state, the populace or advance an ideology upon the masses.',
      'Government & Court',
      HUT_SENTINEL,
      HUT_SENTINEL
    ),
    c(
      'Cyberterrorism',
      'Felony (HUT)',
      'Suspect was found using computers, networks, or electronic systems to conduct attacks, intrusions, or disruptions with intent to intimidate, coerce, or cause substantial harm to the State, its infrastructure, or the public.',
      'Government & Court',
      HUT_SENTINEL,
      HUT_SENTINEL
    ),
    c(
      'Aggravated Money Laundering',
      'Felony (HUT)',
      'Suspect was found in possession of more than ₡50,000 in marked or illicit currency, or engaged in financial transactions intended to conceal or legitimize proceeds of organized criminal activity.',
      'Property & Economic',
      HUT_SENTINEL,
      HUT_SENTINEL
    ),
  ];

  const rows = [];
  for (const ch of charges) {
    if (!ch || String(ch.category || '').toUpperCase() === 'UTILITY') continue;

    const id = rows.length + 1;

    const isHut = Number(ch.timeMonths) >= HUT_SENTINEL || Number(ch.fineDollars) >= HUT_SENTINEL;

    rows.push({
      id,
      code: `PC-${pad3(id)}`,
      title: String(ch.title || '').trim(),
      category: String(ch.category || '').trim(),
      fine: isHut ? '∞' : money(ch.fineDollars),
      jailTime: isHut ? '∞' : `${Math.max(0, Math.round(Number(ch.timeMonths) || 0))} months`,
      points: 0,
      description: String(ch.description || '').trim(),
    });
  }

  window.MDT_DATA.penalCode = rows;
})();
