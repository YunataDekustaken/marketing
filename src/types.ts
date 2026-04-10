/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type PostStatus = 'Not Started' | 'In Progress' | 'Ready for Review' | 'Scheduled';

export type ViewMode = 'list' | 'kanban' | 'calendar';

export interface Post {
  id: string;
  date: string;
  creatives?: string[]; // Array of URLs or base64 strings
  status: PostStatus;
  contentTitle: string;
  contentType: string;
  format: string;
  topicTheme: string;
  subtopic?: string;
  funnelStatus?: string;
  visualIdeas?: string;
  caption?: string;
  customPrompt?: string;
  notes?: string;
  imageUrl?: string; // For backward compatibility or specific use cases
  userId?: string; // The ID of the user who owns this post
  [key: string]: any; // Allow for custom dynamic columns
}

export const INITIAL_POSTS: Post[] = [
  {
    id: '1',
    date: '2026-04-01',
    status: 'Scheduled',
    contentTitle: 'TOTD',
    contentType: 'Educate',
    format: 'Carousel',
    topicTheme: 'Special tax rebates for working mothers in SG',
    funnelStatus: 'Awareness',
    visualIdeas: 'https://www.canva.com/design/DAHED6c9yI0/BnX_yccuI1wAm9m80oW9ug/edit',
    caption: '𝐓𝐈𝐏 𝐎𝐅 𝐓𝐇𝐄 𝐃𝐀𝐘: Which special tax rebates apply to working mothers in Singapore? From Singapore’s targeted support schemes for working mothers to the Philippines’ broader, family - oriented tax benefits, these frameworks are designed to ease the financial burden on households - particularly for women who continuously balance professional responsibilities with the equally demanding role of caregiving. 💭 Want your legal concerns to be answered? Feel free to comment about any other tips you’d like to see from us! #STLAFTipOfTheDay#Taxation #Womansplain#legalph #batasph'
  },
  {
    id: '2',
    date: '2026-04-03',
    status: 'Ready for Review',
    contentTitle: 'BLOG',
    contentType: 'Educate',
    format: 'Article',
    topicTheme: 'Workplace Protections for Women Under Philippine Law',
    funnelStatus: 'Awareness'
  },
  {
    id: '3',
    date: '2026-04-04',
    status: 'Not Started',
    contentTitle: 'REEL',
    contentType: 'Engage',
    format: 'Reel',
    topicTheme: '',
    funnelStatus: 'Consideration'
  },
  {
    id: '4',
    date: '2026-04-06',
    status: 'Scheduled',
    contentTitle: 'JURISPRUDENCE',
    contentType: 'Educate',
    format: 'Carousel',
    topicTheme: '',
    funnelStatus: 'Awareness',
    visualIdeas: 'https://canva.link/2f8ky6nonbivufc',
    caption: '𝐉𝐔𝐑𝐈𝐒𝐏𝐑𝐔𝐃𝐄𝐍𝐂𝐄: Does Financial Recklessness and Abandonment Constitute Psychological Incapacity? | G.R. No. 258705 [Formerly UDK No. 17095] When do destructive behavior and abandonment go beyond marital conflict and become psychological incapacity under the Family Code? In this case, a husband sought the declaration of nullity of marriage after his spouse allegedly incurred massive debts, fabricated stories to secure loans, forced him into financial ruin, and eventually abandoned their family. The Supreme Court examined whether these acts reflected a grave and incurable inability to perform essential marital obligations, applying the standards set in Tan-Andal and the concept of vinculum juris in marriage. 🧠 When does a personality disorder amount to psychological incapacity? 📚 Tap the link to read the digest ➡️ https://tinyurl.com/4y99vchk 💬 Agree or disagree with the Court’s ruling? Share your thoughts below ⬇️ #STLAFJurisprudence #STLAFCaseDigest #legalph #batasph'
  },
  {
    id: '5',
    date: '2026-04-08',
    status: 'Scheduled',
    contentTitle: 'TOTD',
    contentType: 'Educate',
    format: 'Carousel',
    topicTheme: 'Marriages prohibited under law',
    funnelStatus: 'Awareness',
    caption: '𝐓𝐈𝐏 𝐎𝐅 𝐓𝐇𝐄 𝐃𝐀𝐘: Incestuous marriages under PH law Some love stories are meant to be untold—not by fate, but by the law. In the Philippine jurisdiction, relationships bound by incest, consanguinity, affinity, or adoption are prohibited, drawing a clear line between what the heart may feel and what society must forbid. 💭 Want your legal concerns to be answered? Feel free to comment about any other tips you’d like to see from us! #STLAFTipOfTheDay #incest #marriage #legalph #batasph'
  },
  {
    id: '6',
    date: '2026-04-09',
    status: 'Scheduled',
    contentTitle: 'STATIC',
    contentType: 'Engage',
    format: 'Post',
    topicTheme: 'Araw ng Kagitingan',
    funnelStatus: 'Awareness',
    visualIdeas: 'https://canva.link/8p953ynwx9x1cfs',
    caption: '𝐌𝐀𝐋𝐈𝐆𝐀𝐘𝐀𝐍𝐆 𝐀𝐑𝐀𝐖 𝐍𝐆 𝐊𝐀𝐆𝐈𝐓𝐈𝐍𝐆𝐀𝐍 To honor the past is to recognize the present, including the courage and sacrifices of those who fought for our freedom during the Battle of Bataan. On this Day of Valor, we remember the people’s bravery and what it stands for today—the liberties we enjoy today were won by their resilience, unity, and patriotism. Per RA 3022, we honor the past and carry forward the legacy of those who stood firm in the face of adversity by remembering their sacrifices and protecting the values they fought for. We ensure a future where the spirit of valor continues to guide the nation. #STLAF#ArawNgKagitingan'
  },
  {
    id: '7',
    date: '2026-04-10',
    status: 'Not Started',
    contentTitle: 'BLOG',
    contentType: 'Educate',
    format: 'Article',
    topicTheme: '',
    funnelStatus: 'Awareness'
  },
  {
    id: '8',
    date: '2026-04-11',
    status: 'Scheduled',
    contentTitle: 'DOTD',
    contentType: 'Educate',
    format: 'Post',
    topicTheme: 'Plain View Doctrine',
    funnelStatus: 'Awareness',
    caption: '𝐃𝐎𝐂𝐓𝐑𝐈𝐍𝐄 𝐎𝐅 𝐓𝐇𝐄 𝐃𝐀𝐘: Plain View Doctrine G.R. No. 228608 | Under the plain view doctrine, objects falling within the plain view of a law enforcement officer, who has a right to be in a position to have that view, may be validly seized by such officer without a warrant and, thus, may be introduced in evidence. An object is deemed in plain view when it is "open to eye and hand" or is "plainly exposed to sight.” #STLAFDoctrineOfTheDay #PlainViewDoctrine #legalph #lawph'
  },
  {
    id: '9',
    date: '2026-04-13',
    status: 'Scheduled',
    contentTitle: 'STATIC',
    contentType: 'Engage',
    format: 'Post',
    topicTheme: 'National Solo Parents’ Week',
    funnelStatus: 'Awareness',
    caption: '𝐀𝐋𝐋 𝐇𝐀𝐈𝐋, 𝐒𝐎𝐋𝐎 𝐏𝐀𝐑𝐄𝐍𝐓𝐒! In commemoration of National Solo Parents Week, we honor the resilience, strength, and dedication of solo parents across the Philippines. Through Republic Act No. 11861, the third week of April is declared National Solo Parents Week, while the third Saturday of April is observed as National Solo Parents Day. Through this, we recognize and provide support to solo parents who fulfill the roles of both provider and nurturer for their families. You are never alone. We, at STLAF, extend our support to solo parents and recognize their dedication and sacrifices in providing for their families. Our deepest love and respect for everything that you do. #STLAF #NationalSoloParentsWeek #RA11861'
  },
  {
    id: '10',
    date: '2026-04-14',
    status: 'In Progress',
    contentTitle: 'JURISPRUDENCE',
    contentType: 'Educate',
    format: 'Carousel',
    topicTheme: '',
    funnelStatus: 'Awareness',
    caption: '𝐉𝐔𝐑𝐈𝐒𝐏𝐑𝐔𝐃𝐄𝐍𝐂𝐄: Is a VAT assessment void if the taxpayer files a late reply to the PAN? | G.R. No. 272354 In this case, a company challenged a deficiency VAT assessment, arguing that the BIR failed to consider its explanations and supporting documents, allegedly violating Section 228 of the NIRC and due process standards under jurisprudence. The Supreme Court examined whether missing the 15-day reglementary period to reply to the PAN invalidates the assessment and whether due process was still observed during the administrative and judicial stages. 📚 Tap the link to read the digest ➡️https://tinyurl.com/3t82h3se 💬 Agree or disagree with the Court’s ruling? Share your thoughts below ⬇️#STLAFJurisprudence #STLAFCaseDigest #legalph #batasph'
  },
  {
    id: '11',
    date: '2026-04-15',
    status: 'Scheduled',
    contentTitle: 'TOTD/STATIC',
    contentType: 'Educate',
    format: 'Carousel',
    topicTheme: 'Tax Filing Day',
    funnelStatus: 'Consideration',
    caption: '𝐓𝐈𝐏 𝐎𝐅 𝐓𝐇𝐄 𝐃𝐀𝐘: What should you keep in mind on this Tax Filing Day? By keeping your taxes in order, you avoid penalties, legal issues, and unnecessary stress. More importantly, proper tax filing helps protect your business and supports long-term growth. But how do you navigate proper tax filing? What should you watch out for to stay compliant? Learn the essentials, avoid common red flags, and follow the right steps to keep your business on track. 💭 Want your legal concerns to be answered? Feel free to comment about any other tips you’d like to see from us! #STLAFTipOfTheDay #TaxFilingDay #taxph #legalph #batasph'
  },
  {
    id: '12',
    date: '2026-04-17',
    status: 'Not Started',
    contentTitle: 'BLOG',
    contentType: 'Educate',
    format: 'Article',
    topicTheme: 'Solo parents',
    funnelStatus: 'Awareness'
  },
  {
    id: '13',
    date: '2026-04-18',
    status: 'Not Started',
    contentTitle: 'REEL',
    contentType: 'Engage',
    format: 'Reel',
    topicTheme: '',
    funnelStatus: 'Consideration'
  },
  {
    id: '14',
    date: '2026-04-20',
    status: 'Scheduled',
    contentTitle: 'JURISPRUDENCE',
    contentType: 'Educate',
    format: 'Carousel',
    topicTheme: '',
    funnelStatus: 'Awareness',
    caption: '𝐉𝐔𝐑𝐈𝐒𝐏𝐑𝐔𝐃𝐄𝐍𝐂𝐄: Is a fixed-term employee a regular employee despite contract renewals? | G.R. No. 204944-45 Can repeated fixed-term contracts turn a worker into a regular employee? In this case, a news correspondent engaged under successive fixed-term contracts was diagnosed with a serious illness and later faced non-renewal of her employment. The Supreme Court examined whether continuous rehiring for work that is necessary and desirable to the employer’s business creates regular employment, and whether illness alone can justify termination without certification from a competent public health authority. 📚 Tap the link to read the digest ➡️ https://tinyurl.com/ydsrv9w7 💬 Agree or disagree with the Court’s ruling? Share your thoughts below ⬇️ #STLAFJurisprudence #STLAFCaseDigest #legalph #batasph'
  },
  {
    id: '15',
    date: '2026-04-22',
    status: 'Scheduled',
    contentTitle: 'TOTD',
    contentType: 'Educate',
    format: 'Carousel',
    topicTheme: '2FA & Ticketing Frauds (in relation to an anticipated BTS concert)',
    funnelStatus: 'Awareness',
    caption: '𝐓𝐈𝐏 𝐎𝐅 𝐓𝐇𝐄 𝐃𝐀𝐘: Getting ready for a concert? Find out how 2FA protects you from scams in PH! In a day where ticket scams are popular, using two-factor authentication can help you safeguard all your transactions and protect yourself from scammers. Find out below how it can help you in your transactions and what laws protect you from fraud and scams in the Philippines! 💭 Want your legal concerns to be answered? Feel free to comment about any other tips you’d like to see from us! #STLAFTipOfTheDay #scam #fraud #2FA #legalph #batasph'
  },
  {
    id: '16',
    date: '2026-04-24',
    status: 'Not Started',
    contentTitle: 'BLOG',
    contentType: 'Educate',
    format: 'Article',
    topicTheme: '',
    funnelStatus: 'Awareness'
  },
  {
    id: '17',
    date: '2026-04-25',
    status: 'Scheduled',
    contentTitle: 'LMOTD',
    contentType: 'Educate',
    format: 'Post',
    topicTheme: 'In Pari Delicto Potior Est Conditio Possidentis',
    funnelStatus: 'Awareness',
    caption: '𝐋𝐄𝐆𝐀𝐋 𝐌𝐀𝐗𝐈𝐌 𝐎𝐅 𝐓𝐇𝐄 𝐃𝐀𝐘: In pari delicto potior est conditio possidentis G.R. No. 13300 | It is further well settled, that a party to an illegal contract cannot come into a court of law and ask to have his illegal objects carried out. The rule is expressed in the maxims: "Ex dolo malo non oritur actio," and "In pari delicto potior est conditio defendentis." The law will not aid either party to an illegal agreement; it leaves the parties where it finds them. #STLAFLegalMaximOfTheDay #Inparidelictopotiorestconditiopossidentis #legalph #lawph'
  },
  {
    id: '18',
    date: '2026-04-26',
    status: 'Scheduled',
    contentTitle: 'STATIC',
    contentType: 'Engage',
    format: 'Post',
    topicTheme: 'World Intellectual Property Day',
    funnelStatus: 'Awareness',
    caption: '𝐖𝐎𝐑𝐋𝐃 𝐈𝐍𝐓𝐄𝐋𝐋𝐄𝐂𝐓𝐔𝐀𝐋 𝐏𝐑𝐎𝐏𝐄𝐑𝐓𝐘 𝐃𝐀𝐘 🌐🎨 This World Intellectual Property Day, we recognize the power of innovators, creators, and entrepreneurs who turn ideas into impacts that drive progress in society. Observed every April 26, this day highlights the vital role of intellectual property rights in encouraging creativity and fostering economic growth. Through this year’s theme, “IP and Sports: Ready, Set, Innovate! We honor how intellectual property supports innovation in the world of sports—from advancements in sports technology and equipment to the protection of branding, designs, and media that enrich the experience of athletes and fans alike. We, at STLAF, remain committed to supporting the protection of intellectual property and helping creators, businesses, and innovators safeguard the value of their ideas. #STLAF #WorldIntellectualPropertyDay #WorldIPDay'
  },
  {
    id: '19',
    date: '2026-04-27',
    status: 'Scheduled',
    contentTitle: 'JURISPRUDENCE',
    contentType: 'Educate',
    format: 'Carousel',
    topicTheme: '',
    funnelStatus: 'Awareness',
    caption: '𝐉𝐔𝐑𝐈𝐒𝐏𝐑𝐔𝐃𝐄𝐍𝐂𝐄: Are All Validly Dismissed Employees Entitled to Separation Pay? | G.R. No. 214230 Can an employee who was validly dismissed for gross neglect of duty still receive separation pay on grounds of equity and social justice? In this case, a bank branch manager was terminated due to missing checkbooks and reporting irregularities, and the courts were asked to determine whether length of service and absence of bad faith justify financial assistance despite a lawful dismissal. The Supreme Court clarified the general rule and exceptions on separation pay, especially in cases involving gross and habitual neglect of duty. 📚 Tap the link to read the digest ➡️https://tinyurl.com/u3m3fyk4 💬Agree or disagree with the Court’s ruling? Share your thoughts below ⬇️ #STLAFJurisprudence #STLAFCaseDigest #legalph #batasph'
  },
  {
    id: '20',
    date: '2026-04-29',
    status: 'In Progress',
    contentTitle: 'TOTD',
    contentType: 'Educate',
    format: 'Carousel',
    topicTheme: 'Dress code discrimination in BGC',
    funnelStatus: 'Awareness',
    caption: '𝐓𝐈𝐏 𝐎𝐅 𝐓𝐇𝐄 𝐃𝐀𝐘: When does a fashion opinion become discriminatory and a violation under PH law? In January 2026, BGC implemented a dress code, not allowing youths in particular cultures and fashions to enter the premises of the city. This raises a concern about how this act is considered discriminatory, even if carried out in a non-hostile manner. But can quasi-public spaces like BGC prevent a particular group from entering their premises? 💭 Want your legal concerns to be answered? Feel free to comment about any other tips you’d like to see from us! #STLAFTipOfTheDay #legalph #batasph'
  },
  {
    id: '21',
    date: '2026-05-01',
    status: 'Not Started',
    contentTitle: 'BLOG',
    contentType: 'Educate',
    format: 'Article',
    topicTheme: '',
    funnelStatus: 'Awareness'
  }
];
