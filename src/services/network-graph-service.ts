// src/services/network-graph-service.ts
// Generates network graph data from social intelligence analysis results

export interface NetworkNode {
  id: string;
  name: string;
  type: 'keyword' | 'source' | 'account' | 'district' | 'institution' | 'person';
  val: number; // node size (mention count / influence)
  color: string;
  sentiment: 'positive' | 'negative' | 'neutral';
  sentimentScore: number;
  mentions: number;
  cluster?: string;
  district?: string;
  details?: string;
  relatedPosts?: Array<{ content: string; source: string; url?: string; sentiment: string }>;
}

export interface NetworkLink {
  source: string;
  target: string;
  type: 'mention' | 'co-mention' | 'hashtag' | 'retweet' | 'source-keyword';
  value: number; // edge weight
  label?: string;
}

export interface NetworkGraphData {
  nodes: NetworkNode[];
  links: NetworkLink[];
  clusters: Array<{ id: string; name: string; color: string; nodeCount: number }>;
  stats: {
    totalNodes: number;
    totalLinks: number;
    avgConnections: number;
    highRiskCount: number;
    influencerCount: number;
  };
}

// Muğla ilçeleri
const MUGLA_DISTRICTS = [
  'Muğla', 'Bodrum', 'Fethiye', 'Marmaris', 'Milas', 'Datça', 'Dalaman',
  'Köyceğiz', 'Ortaca', 'Menteşe', 'Seydikemer', 'Ula', 'Yatağan', 'Kavaklıdere'
];

// Sentiment → color mapping
function sentimentColor(sentiment: string, score: number): string {
  if (sentiment === 'positive') return `hsl(140, ${60 + score * 20}%, ${45 + score * 10}%)`;
  if (sentiment === 'negative') return `hsl(0, ${60 + score * 20}%, ${45 + score * 10}%)`;
  return 'hsl(45, 70%, 55%)'; // neutral = yellow
}

// Node type → cluster color
const CLUSTER_COLORS: Record<string, string> = {
  district: 'hsl(200, 80%, 50%)',
  keyword: 'hsl(280, 70%, 55%)',
  source: 'hsl(160, 60%, 45%)',
  account: 'hsl(30, 80%, 55%)',
  institution: 'hsl(220, 70%, 50%)',
  person: 'hsl(340, 70%, 55%)',
};

interface AnalysisItem {
  platform: string;
  content: string;
  sentiment: string;
  sentiment_score: number;
  source_author: string;
  engagement_count: number;
  summary?: string;
  source_url?: string;
  region?: string;
}

/**
 * Generates a network graph from social intelligence analysis data.
 * Creates nodes for keywords, sources, districts, and accounts;
 * creates edges for co-mentions, hashtag sharing, and source-keyword relationships.
 */
export function generateNetworkGraphData(
  analyses: AnalysisItem[],
  keywords: string[] = [],
  options: {
    filter?: 'all' | 'districts' | 'last24h' | 'highRisk' | 'influencers';
    maxNodes?: number;
  } = {}
): NetworkGraphData {
  const { filter = 'all', maxNodes = 400 } = options;

  const nodeMap = new Map<string, NetworkNode>();
  const linkMap = new Map<string, NetworkLink>();
  const nodeRelatedPosts = new Map<string, Array<{ content: string; source: string; url?: string; sentiment: string }>>();

  // Helper: add or update node
  function addNode(id: string, name: string, type: NetworkNode['type'], sentiment: string, score: number, mentions: number = 1, district?: string) {
    const existing = nodeMap.get(id);
    if (existing) {
      existing.mentions += mentions;
      existing.val = Math.min(30, 5 + existing.mentions * 2);
      // Update sentiment to average
      existing.sentimentScore = (existing.sentimentScore + score) / 2;
      existing.sentiment = existing.sentimentScore > 0.3 ? 'positive' : existing.sentimentScore < -0.3 ? 'negative' : 'neutral';
      existing.color = sentimentColor(existing.sentiment, Math.abs(existing.sentimentScore));
    } else {
      const sent = score > 0.3 ? 'positive' : score < -0.3 ? 'negative' : 'neutral';
      nodeMap.set(id, {
        id,
        name,
        type,
        val: Math.min(30, 5 + mentions * 2),
        color: sentimentColor(sent, Math.abs(score)),
        sentiment: sent,
        sentimentScore: score,
        mentions,
        cluster: type,
        district,
        relatedPosts: [],
      });
    }
  }

  // Helper: add link
  function addLink(source: string, target: string, type: NetworkLink['type'], weight: number = 1) {
    const key = [source, target].sort().join('::') + '::' + type;
    const existing = linkMap.get(key);
    if (existing) {
      existing.value += weight;
    } else {
      linkMap.set(key, { source, target, type, value: weight });
    }
  }

  // Helper: track related posts per node
  function addRelatedPost(nodeId: string, post: { content: string; source: string; url?: string; sentiment: string }) {
    if (!nodeRelatedPosts.has(nodeId)) nodeRelatedPosts.set(nodeId, []);
    const posts = nodeRelatedPosts.get(nodeId)!;
    if (posts.length < 10) posts.push(post);
  }

  // Process each analysis item
  for (const item of analyses) {
    const contentLower = item.content.toLowerCase();
    // --- Turkish NLP Sentiment Fallback ---
    // Muğla ili 13 ilçe bazlı duygu analizi: sentiment_score=0 ise içerikten hesapla
    let _effSentiment = item.sentiment;
    let _effScore = item.sentiment_score;
    if (!_effScore || _effScore === 0) {
      const _txt = (item.content + ' ' + (item.summary || '')).toLowerCase();
      const _negWords = [
        'yangın','kaza','deprem','sel','ölüm','hayatını kaybetti','gözaltı','kaçak','sorun',
        'tehlike','uyarı','afet','ihmal','kirlilik','suç','tutuklama','yaralı','bomba',
        'patlama','hasar','zarar','kayıp','şiddet','saldırı','itfaiye','göçük','mahsur',
        'duman','tahliye','faciası','trafik kazası','uçurum','boğulma','zehirlenme',
        'acil','kriz','yasak','ihlal','tartışma','protesto','eylem','grev'
      ];
      const _posWords = [
        'açıldı','başladı','festival','güzel','rekor','artış','yatırım','turist','ödül',
        'başarı','destek','proje','gelişme','kutlama','coşku','sevinç','müjde','onay',
        'hizmet','açılış','büyüme','tamamlandı','kazandı','tamamlama','canlandı',
        'ziyaretçi','ihracat','kalkınma','faaliyete','hibe','teşvik','genişledi',
        'imzalandı','anlaşma','ortaklık','refah','memnun','olumlu','güvenli'
      ];
      const _negCount = _negWords.filter(w => _txt.includes(w)).length;
      const _posCount = _posWords.filter(w => _txt.includes(w)).length;
      if (_negCount > _posCount) {
        _effSentiment = 'negative';
        _effScore = Math.min(0.95, 0.45 + _negCount * 0.12);
      } else if (_posCount > _negCount) {
        _effSentiment = 'positive';
        _effScore = Math.min(0.95, 0.50 + _posCount * 0.10);
      } else {
        _effSentiment = 'neutral';
        _effScore = 0.35;
      }
    }
    const sentScore = _effSentiment === 'positive' ? _effScore : _effSentiment === 'negative' ? -_effScore : 0;
    const postRef = { content: item.content.slice(0, 120), source: item.source_author, url: item.source_url, sentiment: item.sentiment };

    // 1. Add source/author node
    if (item.source_author) {
      const sourceId = `src:${item.source_author}`;
      const sourceType: NetworkNode['type'] = item.platform === 'twitter' ? 'account' : 'source';
      addNode(sourceId, item.source_author, sourceType, item.sentiment, sentScore, 1);
      addRelatedPost(sourceId, postRef);
    }

    // 2. Check for district mentions → create district nodes + links
    const mentionedDistricts: string[] = [];
    for (const district of MUGLA_DISTRICTS) {
      if (contentLower.includes(district.toLowerCase())) {
        const distId = `dist:${district}`;
        addNode(distId, district, 'district', item.sentiment, sentScore, 1, district);
        addRelatedPost(distId, postRef);
        mentionedDistricts.push(distId);

        // Link source → district
        if (item.source_author) {
          addLink(`src:${item.source_author}`, distId, 'mention');
        }
      }
    }

    // 3. Check for keyword matches
    const matchedKeywords: string[] = [];
    for (const kw of keywords) {
      if (contentLower.includes(kw.toLowerCase())) {
        const kwId = `kw:${kw}`;
        addNode(kwId, kw, 'keyword', item.sentiment, sentScore, 1);
        addRelatedPost(kwId, postRef);
        matchedKeywords.push(kwId);

        // Link source → keyword
        if (item.source_author) {
          addLink(`src:${item.source_author}`, kwId, 'source-keyword');
        }

        // Link keyword → districts
        for (const distId of mentionedDistricts) {
          addLink(kwId, distId, 'co-mention');
        }
      }
    }

    // 4. Co-mention links between districts
    for (let i = 0; i < mentionedDistricts.length; i++) {
      for (let j = i + 1; j < mentionedDistricts.length; j++) {
        addLink(mentionedDistricts[i], mentionedDistricts[j], 'co-mention');
      }
    }

    // 5. Co-mention links between keywords
    for (let i = 0; i < matchedKeywords.length; i++) {
      for (let j = i + 1; j < matchedKeywords.length; j++) {
        addLink(matchedKeywords[i], matchedKeywords[j], 'hashtag');
      }
    }

    // 6. Extract hashtags from content
    const hashtags = item.content.match(/#[\wğüşöçıİĞÜŞÖÇ]+/gi) || [];
    for (const tag of hashtags.slice(0, 5)) {
      const tagId = `tag:${tag.toLowerCase()}`;
      addNode(tagId, tag, 'keyword', item.sentiment, sentScore, 1);
      if (item.source_author) {
        addLink(`src:${item.source_author}`, tagId, 'hashtag');
      }
    }

    // 7. Detect institutions/persons from known patterns
    // Muğla ili kurumları — büyükşehir + 13 ilçe belediyesi + kamu kurumları
    const institutionPatterns = [
      { pattern: /büyükşehir belediyesi|muğla belediyesi/i, name: 'Muğla Büyükşehir Belediyesi', type: 'institution' as const },
      { pattern: /bodrum belediyesi/i, name: 'Bodrum Belediyesi', type: 'institution' as const },
      { pattern: /fethiye belediyesi/i, name: 'Fethiye Belediyesi', type: 'institution' as const },
      { pattern: /marmaris belediyesi/i, name: 'Marmaris Belediyesi', type: 'institution' as const },
      { pattern: /milas belediyesi/i, name: 'Milas Belediyesi', type: 'institution' as const },
      { pattern: /datça belediyesi/i, name: 'Datça Belediyesi', type: 'institution' as const },
      { pattern: /dalaman belediyesi/i, name: 'Dalaman Belediyesi', type: 'institution' as const },
      { pattern: /köyceğiz belediyesi/i, name: 'Köyceğiz Belediyesi', type: 'institution' as const },
      { pattern: /ortaca belediyesi/i, name: 'Ortaca Belediyesi', type: 'institution' as const },
      { pattern: /menteşe belediyesi/i, name: 'Menteşe Belediyesi', type: 'institution' as const },
      { pattern: /seydikemer belediyesi/i, name: 'Seydikemer Belediyesi', type: 'institution' as const },
      { pattern: /ula belediyesi/i, name: 'Ula Belediyesi', type: 'institution' as const },
      { pattern: /yatağan belediyesi/i, name: 'Yatağan Belediyesi', type: 'institution' as const },
      { pattern: /kavaklıdere belediyesi/i, name: 'Kavaklıdere Belediyesi', type: 'institution' as const },
      { pattern: /muğla valiliği|valilik/i, name: 'Muğla Valiliği', type: 'institution' as const },
      { pattern: /üniversite|mkü|muğla sıtkı/i, name: 'Muğla Sıtkı Koçman Üniversitesi', type: 'institution' as const },
      { pattern: /afad/i, name: 'AFAD Muğla', type: 'institution' as const },
      { pattern: /ticaret odası|mto/i, name: 'Muğla Ticaret Odası', type: 'institution' as const },
      { pattern: /emniyet müdürlüğü|polis/i, name: 'Muğla Emniyet Müdürlüğü', type: 'institution' as const },
      { pattern: /jandarma/i, name: 'Jandarma Muğla', type: 'institution' as const },
      { pattern: /orman bölge|orman müd/i, name: 'Muğla Orman Bölge Müdürlüğü', type: 'institution' as const },
      { pattern: /sağlık müdürlüğü|il sağlık/i, name: 'Muğla İl Sağlık Müdürlüğü', type: 'institution' as const },
    ];

    for (const { pattern, name, type } of institutionPatterns) {
      if (pattern.test(item.content)) {
        const instId = `inst:${name}`;
        addNode(instId, name, type, item.sentiment, sentScore, 1);
        addRelatedPost(instId, postRef);
        if (item.source_author) {
          addLink(`src:${item.source_author}`, instId, 'mention');
        }
        for (const distId of mentionedDistricts) {
          addLink(instId, distId, 'co-mention');
        }
      }
    }
  }

  // Attach related posts to nodes
  for (const [nodeId, posts] of nodeRelatedPosts) {
    const node = nodeMap.get(nodeId);
    if (node) node.relatedPosts = posts;
  }

  // Apply filters
  let nodes = Array.from(nodeMap.values());
  let links = Array.from(linkMap.values());

  if (filter === 'districts') {
    const districtIds = new Set(nodes.filter(n => n.type === 'district').map(n => n.id));
    // Keep districts + directly connected nodes
    const connectedIds = new Set<string>();
    for (const link of links) {
      if (districtIds.has(link.source as string)) connectedIds.add(link.target as string);
      if (districtIds.has(link.target as string)) connectedIds.add(link.source as string);
    }
    const keepIds = new Set([...districtIds, ...connectedIds]);
    nodes = nodes.filter(n => keepIds.has(n.id));
  } else if (filter === 'highRisk') {
    nodes = nodes.filter(n => n.sentiment === 'negative' && n.mentions >= 2);
  } else if (filter === 'influencers') {
    nodes = nodes.filter(n => n.mentions >= 3 || n.val >= 10);
  }

  // Limit nodes for performance
  nodes.sort((a, b) => b.mentions - a.mentions);
  nodes = nodes.slice(0, maxNodes);
  const nodeIds = new Set(nodes.map(n => n.id));
  links = links.filter(l => nodeIds.has(l.source as string) && nodeIds.has(l.target as string));

  // Generate cluster info
  const clusterMap = new Map<string, { count: number }>();
  for (const node of nodes) {
    const c = node.cluster || 'other';
    if (!clusterMap.has(c)) clusterMap.set(c, { count: 0 });
    clusterMap.get(c)!.count++;
  }
  const clusters = Array.from(clusterMap.entries()).map(([id, { count }]) => ({
    id,
    name: id.charAt(0).toUpperCase() + id.slice(1),
    color: CLUSTER_COLORS[id] || 'hsl(0, 0%, 50%)',
    nodeCount: count,
  }));

  // Compute stats
  const connectionCounts = new Map<string, number>();
  for (const link of links) {
    connectionCounts.set(link.source as string, (connectionCounts.get(link.source as string) || 0) + 1);
    connectionCounts.set(link.target as string, (connectionCounts.get(link.target as string) || 0) + 1);
  }
  const avgConnections = connectionCounts.size > 0
    ? Array.from(connectionCounts.values()).reduce((a, b) => a + b, 0) / connectionCounts.size
    : 0;

  return {
    nodes,
    links,
    clusters,
    stats: {
      totalNodes: nodes.length,
      totalLinks: links.length,
      avgConnections: Math.round(avgConnections * 10) / 10,
      highRiskCount: nodes.filter(n => n.sentiment === 'negative').length,
      influencerCount: nodes.filter(n => n.mentions >= 3).length,
    },
  };
}
