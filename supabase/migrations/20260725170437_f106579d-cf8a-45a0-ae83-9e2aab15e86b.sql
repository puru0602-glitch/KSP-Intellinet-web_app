
CREATE TABLE public.police_stations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  district text NOT NULL,
  latitude double precision NOT NULL,
  longitude double precision NOT NULL,
  jurisdiction text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.police_stations TO anon;
GRANT SELECT ON public.police_stations TO authenticated;
GRANT ALL ON public.police_stations TO service_role;
ALTER TABLE public.police_stations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Police stations are publicly readable" ON public.police_stations FOR SELECT USING (true);

CREATE TABLE public.suspects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  suspect_code text NOT NULL UNIQUE,
  name text NOT NULL,
  aliases text[] NOT NULL DEFAULT '{}',
  district text NOT NULL,
  station_name text NOT NULL,
  phone_numbers text[] NOT NULL DEFAULT '{}',
  vehicle text,
  mo_description text NOT NULL,
  mo_tags text[] NOT NULL DEFAULT '{}',
  risk_score integer NOT NULL DEFAULT 50,
  cross_jurisdiction text[] NOT NULL DEFAULT '{}',
  status text NOT NULL DEFAULT 'Under Surveillance',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.suspects TO anon;
GRANT SELECT ON public.suspects TO authenticated;
GRANT ALL ON public.suspects TO service_role;
ALTER TABLE public.suspects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Suspects are publicly readable" ON public.suspects FOR SELECT USING (true);

CREATE TABLE public.firs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  fir_number text NOT NULL UNIQUE,
  incident_date date NOT NULL,
  incident_hour integer NOT NULL DEFAULT 0,
  district text NOT NULL,
  station_name text NOT NULL,
  crime_type text NOT NULL,
  status text NOT NULL DEFAULT 'Under Investigation',
  loss_value numeric NOT NULL DEFAULT 0,
  locality text,
  latitude double precision,
  longitude double precision,
  summary text,
  suspect_code text,
  investigating_officer text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.firs TO anon;
GRANT SELECT ON public.firs TO authenticated;
GRANT ALL ON public.firs TO service_role;
ALTER TABLE public.firs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "FIRs are publicly readable" ON public.firs FOR SELECT USING (true);
CREATE INDEX firs_district_idx ON public.firs (district);
CREATE INDEX firs_crime_type_idx ON public.firs (crime_type);
CREATE INDEX firs_incident_date_idx ON public.firs (incident_date);

CREATE TABLE public.network_nodes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  node_id text NOT NULL UNIQUE,
  label text NOT NULL,
  node_type text NOT NULL,
  district text,
  pos_x integer NOT NULL DEFAULT 0,
  pos_y integer NOT NULL DEFAULT 0,
  linked_nodes text[] NOT NULL DEFAULT '{}',
  suspect_code text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.network_nodes TO anon;
GRANT SELECT ON public.network_nodes TO authenticated;
GRANT ALL ON public.network_nodes TO service_role;
ALTER TABLE public.network_nodes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Network nodes are publicly readable" ON public.network_nodes FOR SELECT USING (true);

CREATE TABLE public.crime_hotspots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  district text NOT NULL,
  station_name text,
  latitude double precision NOT NULL,
  longitude double precision NOT NULL,
  intensity numeric NOT NULL DEFAULT 0.5,
  dominant_crime_type text NOT NULL,
  incident_count integer NOT NULL DEFAULT 0,
  peak_window text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.crime_hotspots TO anon;
GRANT SELECT ON public.crime_hotspots TO authenticated;
GRANT ALL ON public.crime_hotspots TO service_role;
ALTER TABLE public.crime_hotspots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Crime hotspots are publicly readable" ON public.crime_hotspots FOR SELECT USING (true);

INSERT INTO public.police_stations (name, district, latitude, longitude, jurisdiction) VALUES
('Whitefield PS','Bengaluru Urban',12.9698,77.7500,'Whitefield / ITPL corridor, Bengaluru East Division'),
('Koramangala PS','Bengaluru Urban',12.9352,77.6245,'Koramangala 1st-8th Block, Bengaluru South East Division'),
('Cybercrime PS','Bengaluru Urban',12.9878,77.5990,'CID Cybercrime, statewide cyber offences'),
('Yeshwanthpur PS','Bengaluru Urban',13.0230,77.5500,'Yeshwanthpur industrial + railway belt'),
('HSR Layout PS','Bengaluru Urban',12.9116,77.6389,'HSR Layout Sectors 1-7'),
('Devaraja PS','Mysuru',12.3072,76.6549,'Devaraja Market and city core'),
('V.V. Puram PS','Mysuru',12.2958,76.6394,'Vidyaranyapuram / south Mysuru'),
('Nazarbad PS','Mysuru',12.3005,76.6650,'Nazarbad, Bannimantap approach roads'),
('Bunder PS','Mangaluru',12.8617,74.8320,'Old Port / Bunder trading belt'),
('Pandeshwar PS','Mangaluru',12.8650,74.8420,'Pandeshwar, State Bank, Hampankatta'),
('Kadri PS','Mangaluru',12.8894,74.8560,'Kadri, Bejai, Mallikatte'),
('Vidyanagar PS','Hubballi-Dharwad',15.3550,75.1300,'Vidyanagar, Hubballi north'),
('Camp PS','Belagavi',15.8570,74.5060,'Belagavi Camp / cantonment'),
('Brahmapur PS','Kalaburagi',17.3350,76.8340,'Brahmapur, Kalaburagi city');

INSERT INTO public.suspects (suspect_code,name,aliases,district,station_name,phone_numbers,vehicle,mo_description,mo_tags,risk_score,cross_jurisdiction,status) VALUES
('S-1042','Ravi Kumar',ARRAY['Chikka','Ravi Anna'],'Bengaluru Urban','Whitefield PS',ARRAY['+91-98450-77231','+91-73490-11208'],'KA-05-MJ-4471 (Pulsar 220)','Two-wheeler theft using duplicated master key between 02:00-04:00; vehicles moved to Hoskote for re-stamping.',ARRAY['Master Key','Night Window','Re-stamping'],92,ARRAY['Bengaluru Urban','Mysuru','Kalaburagi'],'BOLO Active'),
('S-2213','Imran Sheikh',ARRAY['Choti','Imran Bhai'],'Mysuru','Devaraja PS',ARRAY['+91-90080-42014'],'KA-09-HG-2210 (Splendor)','Chain snatching on pillion-ride two-wheeler near temple and market exits during evening prayer hours.',ARRAY['Pillion Snatch','Evening Window'],81,ARRAY['Mysuru','Bengaluru Urban'],'Under Surveillance'),
('S-3390','Prakash Devadiga',ARRAY['PD','Prakash Bunder'],'Mangaluru','Bunder PS',ARRAY['+91-70220-98887','+91-88610-33450'],NULL,'Extortion calls to small traders using rotating pre-paid SIMs; collection through fish-market intermediaries.',ARRAY['Rotating SIM','Trader Extortion'],88,ARRAY['Mangaluru','Udupi'],'Chargesheeted'),
('S-4471','Satish Murthy',ARRAY['Sattu'],'Bengaluru Urban','Cybercrime PS',ARRAY['+91-96320-40402'],NULL,'OTP phishing via fake KYC calls impersonating bank officials; mule accounts opened in Mysuru branches.',ARRAY['Fake KYC','Mule Accounts'],76,ARRAY['Bengaluru Urban','Mysuru'],'Under Investigation'),
('S-5514','Nagesh Gowda',ARRAY['Naga','Gowda'],'Bengaluru Urban','Koramangala PS',ARRAY['+91-99860-21174'],'KA-03-EF-9012 (Activa)','Late-night chain snatching on unlit stretches around pub districts, exiting via service roads.',ARRAY['Unlit Stretch','Pillion Snatch'],79,ARRAY['Bengaluru Urban'],'Under Surveillance'),
('S-6620','Rehman Pasha',ARRAY['Rehu'],'Mysuru','Nazarbad PS',ARRAY['+91-97410-55620'],'KA-09-KA-1120 (Pulsar 150)','Residential burglary of locked houses during festival travel season, entry through rear ventilators.',ARRAY['Rear Entry','Festival Season'],73,ARRAY['Mysuru','Mandya'],'BOLO Active'),
('S-7702','Suresh Shetty',ARRAY['Shetty','Sura'],'Mangaluru','Kadri PS',ARRAY['+91-94480-77002'],'KA-19-P-3388 (Bolero)','Commercial godown burglary with transport arranged in advance; targets electronics consignments.',ARRAY['Godown','Transport Ready'],84,ARRAY['Mangaluru','Hubballi-Dharwad'],'Under Investigation'),
('S-8891','Lokesh Bhat',ARRAY['Loki'],'Mangaluru','Pandeshwar PS',ARRAY['+91-80950-18891'],NULL,'Investment-app cyber fraud targeting NRI families on the coastal belt; funds routed to crypto wallets.',ARRAY['Investment App','Crypto Routing'],69,ARRAY['Mangaluru','Bengaluru Urban'],'Under Surveillance');

INSERT INTO public.firs (fir_number,incident_date,incident_hour,district,station_name,crime_type,status,loss_value,locality,latitude,longitude,summary,suspect_code,investigating_officer) VALUES
('FIR/WFD/2026/2211','2026-07-19',3,'Bengaluru Urban','Whitefield PS','Vehicle Theft','Under Investigation',118000,'ITPL Main Road',12.9852,77.7360,'Pulsar 220 lifted from apartment basement; master-key entry, no glass damage.','S-1042','PSI M. Ramesh'),
('FIR/WFD/2026/2245','2026-07-21',2,'Bengaluru Urban','Whitefield PS','Vehicle Theft','Under Investigation',92000,'Kundalahalli Gate',12.9620,77.7150,'Two-wheeler theft from service road, CCTV shows same MO as FIR/WFD/2026/2211.','S-1042','PSI M. Ramesh'),
('FIR/WFD/2026/2260','2026-07-14',22,'Bengaluru Urban','Whitefield PS','Cyber Fraud','Under Investigation',245000,'Hope Farm Junction',12.9905,77.7480,'Complainant lost funds after fake KYC verification call from spoofed bank number.','S-4471','Insp. L. Kariappa'),
('FIR/KOR/2026/0442','2026-07-18',21,'Bengaluru Urban','Koramangala PS','Chain Snatching','Under Investigation',86000,'80 Feet Road, 4th Block',12.9345,77.6270,'Gold chain snatched from pedestrian by pillion rider on unlit stretch.','S-5514','PSI R. Devaraj'),
('FIR/KOR/2026/0451','2026-07-22',23,'Bengaluru Urban','Koramangala PS','Chain Snatching','Under Investigation',74000,'5th Block Service Road',12.9370,77.6210,'Second snatching in same beat within four days; identical exit route.','S-5514','PSI R. Devaraj'),
('FIR/KOR/2026/0460','2026-07-09',19,'Bengaluru Urban','Koramangala PS','Assault','Chargesheeted',0,'Jyoti Nivas Circle',12.9330,77.6180,'Group assault following traffic altercation outside commercial complex.',NULL,'PSI R. Devaraj'),
('FIR/CYB/2026/1120','2026-07-11',15,'Bengaluru Urban','Cybercrime PS','Cyber Fraud','Under Investigation',680000,'Infantry Road',12.9880,77.5985,'OTP phishing on senior citizen; funds withdrawn via mule accounts in Mysuru.','S-4471','Insp. S. Bhaskar'),
('FIR/CYB/2026/1201','2026-07-20',12,'Bengaluru Urban','Cybercrime PS','Cyber Fraud','Under Investigation',1250000,'Ali Askar Road',12.9910,77.5940,'Nine complainants linked to same fake-KYC call centre; consolidated investigation.','S-4471','Insp. S. Bhaskar'),
('FIR/CYB/2026/1215','2026-07-23',11,'Bengaluru Urban','Cybercrime PS','Cyber Fraud','Under Investigation',430000,'Cunningham Road',12.9925,77.5960,'Investment-app fraud with returns dashboard; payouts stopped after third deposit.','S-8891','Insp. S. Bhaskar'),
('FIR/YPR/2026/1188','2026-07-06',4,'Bengaluru Urban','Yeshwanthpur PS','Vehicle Theft','Resolved',88000,'Goods Shed Road',13.0210,77.5520,'Recovered motorcycle traced to Hoskote re-stamping shed.','S-1042','PSI A. Nayak'),
('FIR/YPR/2026/1194','2026-07-16',1,'Bengaluru Urban','Yeshwanthpur PS','Burglary','Under Investigation',310000,'Rajajinagar Industrial Area',13.0180,77.5480,'Godown shutter cut; electronics consignment removed in tempo.','S-7702','PSI A. Nayak'),
('FIR/HSR/2026/0771','2026-07-13',2,'Bengaluru Urban','HSR Layout PS','Burglary','Under Investigation',420000,'Sector 2, 27th Main',12.9120,77.6400,'Locked residence burgled while family travelling; rear ventilator entry.',NULL,'PSI K. Shivanna'),
('FIR/HSR/2026/0780','2026-07-24',20,'Bengaluru Urban','HSR Layout PS','Chain Snatching','Under Investigation',56000,'Agara Lake Road',12.9180,77.6350,'Chain snatched near lake walking path during evening hours.','S-5514','PSI K. Shivanna'),
('FIR/HSR/2026/0788','2026-07-08',18,'Bengaluru Urban','HSR Layout PS','Assault','Resolved',0,'Sector 7 Market',12.9090,77.6420,'Shopkeeper assaulted during dispute over parking; both parties identified.',NULL,'PSI K. Shivanna'),
('FIR/DVR/2026/0781','2026-07-17',19,'Mysuru','Devaraja PS','Chain Snatching','Under Investigation',94000,'Devaraja Market East Gate',12.3078,76.6540,'Chain snatching at market exit during evening prayer footfall.','S-2213','PSI H. Manjunath'),
('FIR/DVR/2026/0790','2026-07-20',20,'Mysuru','Devaraja PS','Chain Snatching','Under Investigation',67000,'Sayyaji Rao Road',12.3090,76.6520,'Pillion rider snatched mangalsutra; escaped through market lanes.','S-2213','PSI H. Manjunath'),
('FIR/DVR/2026/0802','2026-07-12',17,'Mysuru','Devaraja PS','Vehicle Theft','Under Investigation',72000,'Dhanvantri Road',12.3060,76.6560,'Scooter stolen from paid parking; token misused.',NULL,'PSI H. Manjunath'),
('FIR/VVP/2026/0122','2026-07-15',22,'Mysuru','V.V. Puram PS','Chain Snatching','Chargesheeted',48000,'Vidyaranyapuram Circle',12.2960,76.6400,'Snatching near bus stop; accused identified through CCTV and arrested.','S-2213','PSI G. Suma'),
('FIR/VVP/2026/0131','2026-07-21',1,'Mysuru','V.V. Puram PS','Burglary','Under Investigation',265000,'Ramakrishna Nagar B Block',12.2900,76.6350,'House-break during festival travel; jewellery and cash removed.','S-6620','PSI G. Suma'),
('FIR/NZB/2026/0455','2026-07-10',2,'Mysuru','Nazarbad PS','Burglary','Under Investigation',180000,'Bannimantap Extension',12.3020,76.6690,'Rear ventilator entry, same MO as Ramakrishna Nagar case.','S-6620','Insp. P. Bhat'),
('FIR/NZB/2026/0462','2026-07-23',3,'Mysuru','Nazarbad PS','Vehicle Theft','Under Investigation',95000,'Nazarbad Main Road',12.2995,76.6670,'Pulsar 150 stolen from residential kerbside at night.','S-6620','Insp. P. Bhat'),
('FIR/NZB/2026/0470','2026-07-07',14,'Mysuru','Nazarbad PS','Cyber Fraud','Under Investigation',210000,'Nazarbad Market',12.3010,76.6660,'Mule account traced to Bengaluru fake-KYC network.','S-4471','Insp. P. Bhat'),
('FIR/BUN/2026/0339','2026-07-19',13,'Mangaluru','Bunder PS','Organized Extortion','Under Investigation',350000,'Old Port Bunder',12.8620,74.8310,'Fish-market trader received extortion calls from rotating SIMs.','S-3390','Insp. V. Naik'),
('FIR/BUN/2026/0345','2026-07-22',16,'Mangaluru','Bunder PS','Organized Extortion','Under Investigation',280000,'Bunder Market Road',12.8600,74.8340,'Second trader complaint; same voice sample and collection pattern.','S-3390','Insp. V. Naik'),
('FIR/BUN/2026/0351','2026-07-11',5,'Mangaluru','Bunder PS','Burglary','Resolved',140000,'Bolar Bunder',12.8560,74.8290,'Warehouse burglary; stock recovered from Hubballi transporter.','S-7702','Insp. V. Naik'),
('FIR/PDS/2026/0210','2026-07-18',15,'Mangaluru','Pandeshwar PS','Organized Extortion','Under Investigation',195000,'Hampankatta',12.8660,74.8420,'Hotel owner threatened over protection payments.','S-3390','PSI D. Fernandes'),
('FIR/PDS/2026/0219','2026-07-24',10,'Mangaluru','Pandeshwar PS','Cyber Fraud','Under Investigation',520000,'State Bank Circle',12.8640,74.8400,'NRI family defrauded through investment app; funds routed to crypto wallets.','S-8891','PSI D. Fernandes'),
('FIR/PDS/2026/0226','2026-07-13',23,'Mangaluru','Pandeshwar PS','Assault','Chargesheeted',0,'Car Street',12.8670,74.8440,'Assault outside commercial establishment; accused arrested same night.',NULL,'PSI D. Fernandes'),
('FIR/KDR/2026/0090','2026-07-16',2,'Mangaluru','Kadri PS','Burglary','Under Investigation',610000,'Kadri Temple Road',12.8890,74.8570,'Electronics godown burgled; transport arranged before offence.','S-7702','PSI R. Poojary'),
('FIR/KDR/2026/0097','2026-07-21',21,'Mangaluru','Kadri PS','Chain Snatching','Under Investigation',52000,'Bejai New Road',12.8850,74.8500,'Chain snatched from pedestrian near Mallikatte junction.',NULL,'PSI R. Poojary'),
('FIR/VDN/2026/0512','2026-07-15',3,'Hubballi-Dharwad','Vidyanagar PS','Burglary','Under Investigation',230000,'Vidyanagar 2nd Cross',15.3560,75.1320,'Shop burglary; stolen consignment matched Mangaluru godown case.','S-7702','PSI B. Hiremath'),
('FIR/CMP/2026/0288','2026-07-12',20,'Belagavi','Camp PS','Assault','Under Investigation',0,'Camp Main Road',15.8580,74.5070,'Public brawl near cantonment market; three persons injured.',NULL,'PSI N. Patil'),
('FIR/BRP/2026/0177','2026-07-17',2,'Kalaburagi','Brahmapur PS','Burglary','Under Investigation',160000,'Brahmapur Colony',17.3360,76.8350,'Commercial break-in during sparse patrol window 02:00-04:00.','S-1042','PSI S. Hosamani');

INSERT INTO public.crime_hotspots (name,district,station_name,latitude,longitude,intensity,dominant_crime_type,incident_count,peak_window) VALUES
('Whitefield / ITPL Corridor','Bengaluru Urban','Whitefield PS',12.9698,77.7500,0.94,'Cyber Fraud',214,'Fri 20:00 - Sat 01:00'),
('Koramangala Pub Belt','Bengaluru Urban','Koramangala PS',12.9352,77.6245,0.87,'Chain Snatching',176,'Fri 22:00 - Sat 02:00'),
('Bengaluru Central Cyber Cell','Bengaluru Urban','Cybercrime PS',12.9878,77.5990,0.9,'Cyber Fraud',322,'Weekdays 11:00 - 16:00'),
('HSR Layout Sectors','Bengaluru Urban','HSR Layout PS',12.9116,77.6389,0.71,'Burglary',98,'Tue 01:00 - 04:00'),
('Yeshwanthpur Industrial Belt','Bengaluru Urban','Yeshwanthpur PS',13.0230,77.5500,0.66,'Vehicle Theft',87,'Daily 02:00 - 05:00'),
('Devaraja Market Core','Mysuru','Devaraja PS',12.3072,76.6549,0.85,'Chain Snatching',132,'Daily 18:00 - 21:00'),
('Nazarbad - Bannimantap','Mysuru','Nazarbad PS',12.3005,76.6650,0.68,'Burglary',74,'Daily 01:00 - 04:00'),
('Vidyaranyapuram Belt','Mysuru','V.V. Puram PS',12.2958,76.6394,0.58,'Chain Snatching',61,'Daily 20:00 - 23:00'),
('Old Port Bunder Trading Belt','Mangaluru','Bunder PS',12.8617,74.8320,0.91,'Organized Extortion',119,'Weekdays 12:00 - 17:00'),
('Hampankatta - Pandeshwar','Mangaluru','Pandeshwar PS',12.8650,74.8420,0.76,'Cyber Fraud',103,'Weekdays 10:00 - 15:00'),
('Kadri - Bejai','Mangaluru','Kadri PS',12.8894,74.8560,0.73,'Burglary',88,'Daily 01:00 - 04:00'),
('Vidyanagar Hubballi','Hubballi-Dharwad','Vidyanagar PS',15.3550,75.1300,0.62,'Burglary',67,'Daily 02:00 - 05:00'),
('Belagavi Camp','Belagavi','Camp PS',15.8570,74.5060,0.49,'Assault',44,'Weekends 19:00 - 23:00'),
('Brahmapur Kalaburagi','Kalaburagi','Brahmapur PS',17.3350,76.8340,0.55,'Burglary',52,'Daily 02:00 - 04:00');

INSERT INTO public.network_nodes (node_id,label,node_type,district,pos_x,pos_y,linked_nodes,suspect_code) VALUES
('S-1042','Ravi Kumar','suspect','Bengaluru Urban',300,190,ARRAY['V-01','L-01','T-01','T-03','S-2213','S-4471'],'S-1042'),
('S-2213','Imran Sheikh','suspect','Mysuru',640,170,ARRAY['V-02','L-02','T-01','S-1042'],'S-2213'),
('S-3390','Prakash Devadiga','suspect','Mangaluru',500,380,ARRAY['V-03','T-02','L-03','S-8891'],'S-3390'),
('S-4471','Satish Murthy','suspect','Bengaluru Urban',180,390,ARRAY['V-04','T-04','L-04','S-1042','S-8891'],'S-4471'),
('S-5514','Nagesh Gowda','suspect','Bengaluru Urban',420,110,ARRAY['V-05','T-05','L-05'],'S-5514'),
('S-6620','Rehman Pasha','suspect','Mysuru',780,300,ARRAY['V-06','T-06','L-02'],'S-6620'),
('S-7702','Suresh Shetty','suspect','Mangaluru',300,500,ARRAY['V-07','T-07','L-03'],'S-7702'),
('S-8891','Lokesh Bhat','suspect','Mangaluru',680,470,ARRAY['V-08','T-04','L-03','S-3390'],'S-8891'),
('V-01','Victim · FIR/WFD/2026/2211','victim','Bengaluru Urban',160,100,ARRAY['S-1042'],NULL),
('V-02','Victim · FIR/DVR/2026/0781','victim','Mysuru',760,90,ARRAY['S-2213'],NULL),
('V-03','Victim · FIR/BUN/2026/0339','victim','Mangaluru',560,300,ARRAY['S-3390'],NULL),
('V-04','Victim · FIR/CYB/2026/1120','victim','Bengaluru Urban',80,320,ARRAY['S-4471'],NULL),
('V-05','Victim · FIR/KOR/2026/0442','victim','Bengaluru Urban',430,30,ARRAY['S-5514'],NULL),
('V-06','Victim · FIR/VVP/2026/0131','victim','Mysuru',860,230,ARRAY['S-6620'],NULL),
('V-07','Victim · FIR/KDR/2026/0090','victim','Mangaluru',170,540,ARRAY['S-7702'],NULL),
('V-08','Victim · FIR/PDS/2026/0219','victim','Mangaluru',810,520,ARRAY['S-8891'],NULL),
('L-01','Whitefield Hotspot','location','Bengaluru Urban',380,250,ARRAY['S-1042','T-01'],NULL),
('L-02','Devaraja Market','location','Mysuru',700,230,ARRAY['S-2213','S-6620','T-01'],NULL),
('L-03','Bunder Trading Belt','location','Mangaluru',450,460,ARRAY['S-3390','S-7702','S-8891'],NULL),
('L-04','Cybercrime Cell Zone','location','Bengaluru Urban',110,240,ARRAY['S-4471','S-8891'],NULL),
('L-05','Koramangala Pub Belt','location','Bengaluru Urban',540,60,ARRAY['S-5514'],NULL),
('T-01','KA-05-MJ-4471','vehicle','Bengaluru Urban',470,210,ARRAY['S-1042','S-2213','L-01','L-02'],NULL),
('T-02','SIM +91-70220-98887','sim','Mangaluru',390,330,ARRAY['S-3390'],NULL),
('T-03','MO: Master Key','mo','Bengaluru Urban',230,290,ARRAY['S-1042','S-4471'],NULL),
('T-04','MO: Fake KYC / Investment App','mo','Bengaluru Urban',120,450,ARRAY['S-4471','S-8891'],NULL),
('T-05','KA-03-EF-9012','vehicle','Bengaluru Urban',560,140,ARRAY['S-5514'],NULL),
('T-06','KA-09-KA-1120','vehicle','Mysuru',870,360,ARRAY['S-6620'],NULL),
('T-07','KA-19-P-3388','vehicle','Mangaluru',210,440,ARRAY['S-7702'],NULL);
