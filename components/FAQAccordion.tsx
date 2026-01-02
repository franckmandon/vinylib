"use client";

import { useState } from "react";

export interface FAQItem {
  question: string;
  answer: string;
}

export const faqs: FAQItem[] = [
  {
    question: "What is Vinyl Report and why do I need it?",
    answer: `Vinyl Report is a modern web application specifically designed to help vinyl collectors catalogue, organize, and explore their record collections in one centralized platform. It addresses the common frustration collectors face when managing their vinyl libraries across fragmented spreadsheets, notebooks, or disparate digital tools.

The application eliminates tedious manual data entry by automatically fetching comprehensive metadata from Discogs and Wikipedia, it provides a unified interface to track your entire collection with ratings and detailed information, and it connects your physical collection with the digital world through Spotify links. Whether you own 50 or 5,000 records, Vinyl Report centralizes all your collection data in a persistent, accessible database, ensuring your information is always available and never lost.

Beyond simple cataloguing, Vinyl Report transforms how you interact with your collection by making it searchable, filterable, and explorable in ways that physical storage cannot match. Features like the Shuffle Playlist help you rediscover forgotten gems, while export and sharing capabilities let you showcase your collection to other enthusiasts.`
  },
  {
    question: "How do I add records to my collection?",
    answer: `Vinyl Report offers three flexible methods to add records, accommodating different use cases and ensuring speed and accuracy:

**Barcode Scanning (Fastest Method):** From the "+ Add Vinyl" feature, tap on the "Scanner" button to activate your device's camera. Point your camera at the EAN or UPC barcode printed on your vinyl record. The application instantly queries the Discogs database and returns comprehensive metadata including artist name, album title, release year, label, genre, complete tracklist, and official cover artwork.

Here's where Vinyl Report becomes particularly smart: after scanning, you're presented with a choice—"Add to Collection or Bookmarks?" This is incredibly useful when you're browsing in a record store. If you're certain about purchasing, tap "Add to Collection" and the record is immediately added. If you're hesitating or want to compare prices elsewhere, tap "Add to Bookmarks" to save it for later consideration. This bookmark feature is also perfect for sharing purchase ideas with friends or building a wishlist while shopping.

**Manual EAN Entry:** If your record's barcode is damaged, difficult to scan, or you prefer manual entry, you can type the EAN code directly into the EAN Number field. Click the "Infos" button and the application will search the Discogs database using this code, retrieving the same comprehensive metadata as barcode scanning. You can then choose to add it to your collection or bookmarks.

**Search and Bookmark:** If you don't have the EAN code, use the search bar to find releases by typing the artist name, album title, or other identifying information. Browse through the results to find the release that matches your physical copy, then press the bookmark button. Once bookmarked, you can add it to your collection from your Bookmarks section, ensuring you've selected the correct pressing or edition.

**Manual Entry:** For obscure pressings, bootlegs, private releases, or records not yet in the Discogs database, you can manually create an entry from scratch. Fill in the fields you know and leave others blank to complete later. This ensures that even the most unique items in your collection are documented.

All methods can be used interchangeably, and you can always edit or complete information after initial entry. The flexibility of adding records directly to your collection or to bookmarks makes Vinyl Report a perfect companion both at home and while record shopping.`
  },
  {
    question: "What information is stored for each record?",
    answer: `Vinyl Report maintains a comprehensive data structure for each record in your collection, combining objective metadata with your personal documentation:

**Core Metadata:** Artist name, album title, release year, record label, catalog number, genre classification, complete tracklist with song durations when available, and official cover artwork. Pressing type information (Original Pressing or Reissue) and country of origin are also stored when available through Discogs.

**Visual Elements:** High-resolution cover art is automatically retrieved from Discogs to visually represent each record in your collection views.

**Personal Documentation:**
- A star rating system (1-5 stars) allows you to rank favorites and identify standouts
- Physical condition tracking with standardized grades: Mint, Near Mint, Very Good, Good, Fair, or Poor
- Purchase price documentation in Euros to track collection value and investment
- Date added timestamp to monitor collection growth over time
- Pressing type classification to distinguish original pressings from reissues

**Enhanced Context:** The application enriches your records with contextual information from Wikipedia:
- Artist biographies providing background and career context
- Album descriptions offering historical significance and creative background
- Credits listing musicians, producers, engineers, and contributors involved in the recording

**Digital Connections:** Spotify links can be manually added for both the complete album and individual tracks, creating a bridge between your physical collection and streaming platforms for easy digital playback, preview, and exploration.

This rich data structure transforms your collection from a simple list into a comprehensive knowledge base about your musical library.`
  },
  {
    question: "How does Vinyl Report use Discogs data?",
    answer: `Vinyl Report leverages Discogs as its primary source for accurate, standardized metadata about physical music releases. The integration retrieves detailed information through barcode scanning or EAN code entry.

**Automatic Data Retrieval:** When you scan a barcode or enter an EAN code, Vinyl Report queries the Discogs database and retrieves detailed information including: official release titles, artist credits, label information, catalog numbers, release years, complete tracklists with proper spelling and formatting, genre classification, and high-quality cover artwork. This ensures consistency and accuracy across your collection.

**Handling Multiple Pressings:** Because Discogs maintains detailed records of different pressings, reissues, and editions of the same album, you can identify and select the exact version you own through the search and bookmark feature. This level of detail is particularly valuable for collectors who care about pressing quality, provenance, and distinguishing between original pressings and reissues.

**Editable Data:** While Discogs provides authoritative baseline data, Vinyl Report recognizes that your physical copy might differ slightly or that you might want to add personal clarifications. All fetched information remains fully editable, allowing you to adjust details to match your exact copy, correct any discrepancies, or add information that Discogs might be missing.

**Complementary Wikipedia Data:** Beyond Discogs metadata, Vinyl Report automatically fetches contextual information from Wikipedia, including artist biographies, album descriptions, and recording credits. This enrichment happens automatically through dedicated "Fetch from Wikipedia" buttons, adding educational and historical depth to your collection data.`
  },
  {
    question: "How can I organize and search my collection?",
    answer: `Yes, Vinyl Report provides powerful and intuitive organization capabilities designed specifically for navigating large vinyl collections:

**Multi-Criteria Search:** The search function works across multiple fields simultaneously including artist names, album titles, and label names, allowing you to find specific records quickly even if you only remember partial information. Type a few characters and results appear instantly.

**Genre Filtering:** The "All Genres" dropdown filter allows you to browse your collection by musical style. This is particularly useful when you're in the mood for specific types of music or when you want to see the depth of your collection within certain genres.

**Sorting Options:** The "Sort by Date Added" feature lets you organize your collection chronologically, helping you track recent acquisitions or browse your collection in the order you built it. This is especially useful for remembering when you acquired specific records or reviewing your latest additions.

**Owner Filtering:** The application supports multi-user collections with owner-based filtering. You can view records owned by specific users (e.g., "Showing vinyls from: GetFrank"), making it perfect for shared collections or households with multiple collectors.

**Visual Browsing Modes:** Toggle between list and grid views to browse your collection either as a detailed table with all metadata visible or as a visually rich grid with cover artwork prominently displayed, letting you browse as you would with physical records but with the added benefits of instant filtering and search.

**Bookmarks System:** Save interesting releases you're considering adding to your collection using the bookmark feature. This creates a wishlist or "to-acquire" list separate from your main collection, helping you track records you want to find.

This organizational flexibility transforms your collection from a static archive into a dynamic, explorable database.`
  },
  {
    question: "Can I rate records and track their condition?",
    answer: `Absolutely. Vinyl Report provides comprehensive tools for documenting both your opinions and the physical state of your collection:

**Dual Rating System:**
- **Your Personal Rating:** Assign 1 to 5 stars to each record based on your preferences, creating a personal hierarchy within your collection. These ratings help you quickly identify favorites, track which albums resonate most over time, and make informed decisions about what to play
- **Average Rating:** The application also displays average ratings from other users who own the same record (shown as "Average rating" with the number of ratings in parentheses), providing community perspective alongside your personal opinion

**Physical Condition Tracking:** Each record can be assigned a standardized condition grade:
- **Mint:** Perfect condition, as new
- **Near Mint:** Almost perfect with minimal signs of handling
- **Very Good:** Shows some signs of use but plays perfectly
- **Good:** Visible wear but still plays well
- **Fair:** Significant wear with potential audio issues
- **Poor:** Heavily worn with noticeable playback problems

This standardized grading helps you track restoration needs, insurance purposes, and resale value.

**Collection Value Tracking:** Document the purchase price in Euros for each record. This allows you to track total collection value and investment, monitor which records were bargains or premium acquisitions, maintain insurance documentation, and analyze spending patterns over time.

**Acquisition Timeline:** A "Date Added" field automatically timestamps when each record entered your collection. This helps you visualize collection growth, remember acquisition timing, and organize chronologically.

**Ratings Evolution:** Ratings can be updated anytime as your opinions evolve. A record initially rated 3 stars might become a 5-star favorite after repeated listens, and Vinyl Report accommodates this natural progression.

All this information is persistently stored, ensuring your personal documentation is preserved and always accessible. This transforms Vinyl Report from a mere catalogue into a personal collection analysis tool.`
  },
  {
    question: "How do Spotify links enhance my collection experience?",
    answer: `Spotify integration creates a powerful bridge between your physical vinyl collection and the digital streaming world, significantly expanding how you interact with your music.

**Flexible Linking Options:** Vinyl Report allows you to manually add Spotify links at two levels:
- **Album-level links:** Add a single Spotify link for the entire album, providing quick access to the complete release
- **Track-level links:** Add individual Spotify links for specific tracks, which is useful when certain songs are particularly noteworthy or when the album version differs between vinyl and Spotify

**Instant Digital Access:** Manually added Spotify links allow you to stream albums or tracks from your collection, providing convenience for digital playback when you don't have access to a turntable, when you're away from home, or when you want to listen at work. This creates a seamless connection between your physical collection and digital convenience.

**Pre-Listen and Evaluation:** Add Spotify links to bookmarked releases to preview new vinyl before purchasing. This helps you evaluate sound quality, discover new music, and decide if a record is worth adding to your physical collection, reducing purchasing mistakes and ensuring you invest in music you'll truly enjoy.

**Artist Discovery:** Spotify links enable exploration of related artists, similar albums, and artist discographies directly from records in your collection. Spotify's recommendation algorithms can then suggest new music based on your vinyl preferences, creating a discovery loop between your physical collection and digital exploration.

**Hybrid Collection Management:** Modern music consumption often involves streaming services even for serious vinyl collectors. Vinyl Report unifies both worlds in a single interface, recognizing that vinyl collectors often use streaming services for convenience, discovery, or when traveling.

**Track-Specific Documentation:** Individual track links are particularly useful for compilations, live albums, or records where specific songs have unique Spotify versions, remasters, or alternate takes worth comparing.

The Spotify integration, though manual, provides maximum flexibility in how you connect your physical collection with the streaming world, letting you curate these links thoughtfully based on your specific needs.`
  },
  {
    question: "What happens if a record is missing or the data is incorrect?",
    answer: `Vinyl Report is designed with real-world collecting in mind, recognizing that not all records fit neatly into databases and that flexibility is essential:

**Full Manual Editing:** Every field in every record entry is editable, regardless of whether the data was automatically fetched from Discogs or manually entered. If artist names are misspelled, release years are incorrect, or genre classifications don't match your understanding, simply click into any field and modify it. Changes are immediately saved to your collection.

**Handling Missing Records:** For records not in the Discogs database such as obscure local pressings, bootlegs, private releases, extremely rare items, or brand new releases not yet catalogued, you can create complete manual entries. Fill in the Artist and Album fields, add whatever additional information you know (release date, genre, label), and leave other fields blank to complete later as you research or discover more details.

**Correcting Metadata:** Sometimes Discogs data might be incomplete or might not match your specific pressing variant. Vinyl Report allows you to correct any discrepancies to accurately reflect your exact copy, ensuring your collection documentation is precise. The "Country of Origin" and "Pressing Type" fields are particularly useful for distinguishing between different versions.

**Wikipedia Enrichment Control:** If automatically fetched Wikipedia data seems incorrect or incomplete, you can manually edit the Artist Bio, Description (album background), and Credits fields. The "Fetch from Wikipedia" buttons allow you to retry automatic retrieval, but you always maintain full editorial control.

**Supporting Unique Items:** The application doesn't force standardization. Your collection might include test pressings, white labels, colored vinyl variants, or special editions with unique characteristics. The flexible data model accommodates these edge cases, with fields like Condition and Pressing Type specifically designed for collector-level detail.

**Continuous Improvement:** As you learn more about records in your collection through research, interactions with other collectors, or discovery of additional information, you can continuously update and refine entries. The "Update" button in the edit interface saves all changes, making your collection database increasingly comprehensive over time.

This flexibility ensures that Vinyl Report adapts to your collection's reality rather than forcing your collection to conform to rigid database structures.`
  },
  {
    question: "Can Vinyl Report help me better understand and explore my collection?",
    answer: `Yes, Vinyl Report is designed not just for cataloguing, but for deepening your engagement with and understanding of your collection through multiple discovery and analysis features:

**Rediscovery Through Search and Filters:** Advanced filtering and search capabilities help you rediscover forgotten records buried in your collection. Filter by genre, sort by date added, or search by artist to surface albums you haven't listened to recently or identify sections of your collection that deserve more attention.

**Shuffle Playlist Feature:** The "Wonder what to Spin? Let us choose for you" feature randomly selects 8 albums from your collection, displayed with cover art, artist, title, rating, release date, genre, and label. This serendipitous approach helps you:
- Break decision paralysis when choosing what to play
- Rediscover forgotten favorites
- Create spontaneous listening sessions
- Appreciate the diversity of your collection

Click "Shuffle Again" to generate a new random selection whenever you need fresh inspiration.

**Pattern Recognition Through Organization:** By viewing your collection holistically through genre distributions, chronological sorting, and condition tracking, you can identify collecting patterns, discover biases in your acquisitions, and recognize gaps worth addressing. You might discover you're heavily focused on certain decades, genres, or labels, informing future purchasing decisions.

**Contextual Learning:** Wikipedia integration enriches each record with:
- Artist biographies providing career context and musical evolution
- Album descriptions offering historical significance, recording circumstances, and critical reception
- Detailed credits listing musicians, producers, engineers, and contributors

This transforms listening sessions into educational experiences, deepening your appreciation for the music and its cultural context.

**Rating Analysis:** Over time, your star ratings create a personal canon that reflects your evolving musical taste. The dual rating system (your rating vs. average rating) lets you see where your opinions align with or diverge from other collectors, potentially sparking interesting discoveries.

**Collection Statistics Awareness:** While browsing, you naturally develop awareness of collection composition: how many records you own, which genres dominate, which artists are most represented, and how your collection has grown over time based on the Date Added field.

**Bookmarks for Strategic Growth:** The Bookmarks feature helps you maintain a curated wishlist of records you're considering acquiring. Whether you bookmarked albums while browsing in a record store or researching at home, this wishlist helps you plan purchases strategically, avoid impulsive duplicates, and share purchase ideas with fellow collectors.

**Export and Sharing:** The "Export collection" feature generates a downloadable CSV file containing all your collection data. This allows you to:
- Create permanent backups of your collection information
- Analyze your collection using spreadsheet software or external tools
- Generate reports on collection value, genre distribution, or acquisition patterns
- Maintain insurance documentation with a complete inventory
- Import your data into other applications if needed

The "Share collection" feature allows you to showcase your vinyl library with other enthusiasts via AirDrop, Mail, Messages, or other platforms, making it easy to discuss collections with friends or participate in collector communities.

Vinyl Report transforms passive ownership into active exploration, helping you engage more deeply with the music you already own while providing insights that guide your collecting journey and help you appreciate the scope and character of your library.`
  },
  {
    question: "How should I get started if I'm new to Vinyl Report?",
    answer: `Starting with Vinyl Report is designed to be simple and immediately rewarding, with a clear path from first use to comprehensive collection management:

**Initial Setup (5 minutes):** Create your account and familiarize yourself with the clean, intuitive interface. Grant camera permissions if you plan to use the barcode scanning feature. No complex configuration is required; the application is ready to use immediately after signing up.

**Start Small (First 5-10 Records):** Don't feel pressure to catalogue your entire collection immediately. Begin by adding 5-10 records using the method that feels most comfortable:
- Tap "+ Add Vinyl" and use the "Scanner" button to scan barcodes for the fastest experience
- Or enter EAN codes manually and click "Infos" to retrieve data
- Or use the search function to find releases, bookmark them, and add from your Bookmarks

Choose a mix of albums you know well and some you're less familiar with to see how the application handles both.

**Experiment with Core Features:** Once you have a few records entered:
- Assign star ratings to your favorites to see the rating system in action
- Select a condition grade (Mint, Near Mint, etc.) for each record to track physical state
- Add Spotify links for an album and a few individual tracks to understand the dual-level linking
- Try the "Shuffle Playlist" feature to see random selection in action
- Use genre filters and sort options to navigate your growing collection

**Observe Automatic Enrichment:** Notice how Discogs automatically provides comprehensive metadata when you scan barcodes or enter EAN codes. Use the "Fetch from Wikipedia" buttons to see how artist biographies, album descriptions, and credits automatically populate. This helps you understand the application's capabilities and what to expect as you add more records.

**Develop Your Personal Workflow:** Determine which input method works best for your collection and situation:
- Many users scan barcodes for standard releases with readable codes
- Use manual EAN entry for records with damaged or hard-to-scan barcodes
- Use search and bookmark for records without EAN codes or when you're researching before purchasing

Find your personal rhythm that balances speed with accuracy.

**Leverage Bookmarks Before Buying:** As you discover new records you're interested in acquiring, search for them and add them to your Bookmarks. This creates a strategic wishlist you can review before purchases, helping avoid duplicates and impulse buys.

**Gradual Expansion:** After mastering the basics, continue adding records at whatever pace feels comfortable; 10 per session, one shelf at a time, or focusing on specific genres first. The application scales effortlessly from a dozen records to thousands.

**No Pressure, Flexible Approach:** There's no deadline and no requirement to be comprehensive immediately. Some users add their entire collection in a weekend marathon, others add records gradually over months. Both approaches work perfectly. Vinyl Report grows with you, and features that seem unnecessary with 10 records (like the Shuffle Playlist or export function) become essential with 500.

**Explore Advanced Features When Ready:** As your collection grows, experiment with:
- The "My Collection" overview to see your complete library
- Export functionality to create backups
- Share collection to showcase your vinyl to friends
- Browse All vs. filtered views to navigate efficiently

The key is starting simple, experiencing immediate value from even a small catalogued collection, and allowing your usage to evolve naturally as your digital collection expands alongside your physical one.`
  }
];

interface FAQAccordionProps {
  faq: FAQItem;
  index: number;
}

export default function FAQAccordion({ faq, index }: FAQAccordionProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border border-slate-300 dark:border-slate-600 rounded-lg mb-4">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors rounded-lg"
      >
        <span className="font-semibold text-slate-900 dark:text-slate-100 pr-4 text-xl">
          {faq.question}
        </span>
        <svg
          className={`w-5 h-5 text-slate-600 dark:text-slate-400 flex-shrink-0 transition-transform ${
            isOpen ? "transform rotate-180" : ""
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>
      {isOpen && (
        <div className="px-6 pb-4">
          <div 
            className="text-slate-700 dark:text-slate-300 whitespace-pre-line leading-relaxed"
            dangerouslySetInnerHTML={{
              __html: faq.answer
                .replace(/\*\*([^*]+?):?\*\*/g, (match, content) => {
                  const trimmedContent = content.trim();
                  // Don't add line break after "Personal Documentation"
                  if (trimmedContent === 'Personal Documentation') {
                    return `<strong style="color: rgb(147 197 253); font-weight: bold;">${content}</strong>`;
                  }
                  // Don't format these specific list items in blue, but keep line break
                  const excludedItems = [
                    'Your Personal Rating',
                    'Average Rating',
                    'Mint',
                    'Near Mint',
                    'Very Good',
                    'Good',
                    'Fair',
                    'Poor',
                    'Album-level links',
                    'Track-level links'
                  ];
                  
                  if (excludedItems.includes(trimmedContent)) {
                    // Return as plain bold text without blue color, but with line break
                    return `<strong>${content}</strong><br />`;
                  }
                  
                  return `<strong style="color: rgb(147 197 253); font-weight: bold;">${content}</strong><br />`;
                })
            }}
          />
        </div>
      )}
    </div>
  );
}

