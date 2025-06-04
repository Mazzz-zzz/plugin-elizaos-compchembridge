/**
 * Client-side molecule statistics display component
 * Based on Discord client patterns for ElizaOS plugins
 */

import { KnowledgeGraphStats } from "../types/queryGaussianKnowledge.js";

export interface MoleculeStatsDisplayOptions {
  showEmojis?: boolean;
  compact?: boolean;
  theme?: "light" | "dark" | "auto";
}

export class MoleculeStatsDisplay {
  private options: MoleculeStatsDisplayOptions;

  constructor(options: MoleculeStatsDisplayOptions = {}) {
    this.options = {
      showEmojis: true,
      compact: false,
      theme: "auto",
      ...options,
    };
  }

  /**
   * Format molecule stats for Discord-style display
   */
  formatStats(stats: KnowledgeGraphStats): string {
    if (stats.error) {
      return `❌ **Error**: ${stats.error}`;
    }

    const { showEmojis } = this.options;
    const emojis = showEmojis
      ? {
          title: "🧪",
          storage: "💾",
          triples: "🔗",
          molecules: "⚛️",
          energies: "⚡",
          gaps: "🌈",
          frequencies: "🎵",
          atoms: "🟢",
          files: "📄",
          updated: "🕒",
        }
      : {
          title: "",
          storage: "",
          triples: "",
          molecules: "",
          energies: "",
          gaps: "",
          frequencies: "",
          atoms: "",
          files: "",
          updated: "",
        };

    if (this.options.compact) {
      return this.formatCompactStats(stats, emojis);
    }

    return this.formatDetailedStats(stats, emojis);
  }

  private formatCompactStats(stats: KnowledgeGraphStats, emojis: any): string {
    return `${emojis.title} **Gaussian KB**: ${stats.molecules} molecules, ${stats.scfEnergies} energies, ${stats.atoms} atoms`;
  }

  private formatDetailedStats(stats: KnowledgeGraphStats, emojis: any): string {
    const fileSizeKB = (stats.fileSize / 1024).toFixed(1);
    const lastUpdated = new Date(stats.lastModified).toLocaleString();

    return `${emojis.title} **Gaussian Knowledge Base Statistics**

${emojis.storage} **Storage**: ${fileSizeKB} KB
${emojis.triples} **RDF Triples**: ${stats.totalTriples.toLocaleString()}
${emojis.molecules} **Molecules**: ${stats.molecules.toLocaleString()}
${emojis.energies} **SCF Energies**: ${stats.scfEnergies.toLocaleString()}
${emojis.gaps} **HOMO-LUMO Gaps**: ${stats.homoLumoGaps.toLocaleString()}
${emojis.frequencies} **Frequencies**: ${stats.frequencies.toLocaleString()}
${emojis.atoms} **Total Atoms**: ${stats.atoms.toLocaleString()}
${emojis.files} **Files Processed**: ${stats.processedFiles.toLocaleString()}
${emojis.updated} **Last Updated**: ${lastUpdated}`;
  }

  /**
   * Format stats as an embed-style object for Discord
   */
  formatAsDiscordEmbed(stats: KnowledgeGraphStats): any {
    if (stats.error) {
      return {
        title: "❌ Gaussian Knowledge Base Error",
        description: stats.error,
        color: 0xff0000, // Red
        timestamp: new Date().toISOString(),
      };
    }

    const fields = [
      {
        name: "💾 Storage",
        value: `${(stats.fileSize / 1024).toFixed(1)} KB`,
        inline: true,
      },
      {
        name: "🔗 RDF Triples",
        value: stats.totalTriples.toLocaleString(),
        inline: true,
      },
      {
        name: "⚛️ Molecules",
        value: stats.molecules.toLocaleString(),
        inline: true,
      },
      {
        name: "⚡ SCF Energies",
        value: stats.scfEnergies.toLocaleString(),
        inline: true,
      },
      {
        name: "🌈 HOMO-LUMO Gaps",
        value: stats.homoLumoGaps.toLocaleString(),
        inline: true,
      },
      {
        name: "🎵 Frequencies",
        value: stats.frequencies.toLocaleString(),
        inline: true,
      },
      {
        name: "🟢 Total Atoms",
        value: stats.atoms.toLocaleString(),
        inline: true,
      },
      {
        name: "📄 Files Processed",
        value: stats.processedFiles.toLocaleString(),
        inline: true,
      },
    ];

    return {
      title: "🧪 Gaussian Knowledge Base Statistics",
      fields: fields,
      color: 0x00ff88, // Green
      timestamp: new Date(stats.lastModified).toISOString(),
      footer: {
        text: "Computational Chemistry Knowledge Graph",
      },
    };
  }

  /**
   * Format stats for terminal/console display
   */
  formatForConsole(stats: KnowledgeGraphStats): string {
    if (stats.error) {
      return `\x1b[31m❌ Error: ${stats.error}\x1b[0m`;
    }

    const cyan = "\x1b[36m";
    const yellow = "\x1b[33m";
    const green = "\x1b[32m";
    const reset = "\x1b[0m";
    const bold = "\x1b[1m";

    return `${cyan}${bold}🧪 Gaussian Knowledge Base Statistics${reset}

${yellow}Storage:${reset}         ${(stats.fileSize / 1024).toFixed(1)} KB
${yellow}RDF Triples:${reset}     ${stats.totalTriples.toLocaleString()}
${yellow}Molecules:${reset}       ${green}${stats.molecules.toLocaleString()}${reset}
${yellow}SCF Energies:${reset}    ${green}${stats.scfEnergies.toLocaleString()}${reset}
${yellow}HOMO-LUMO Gaps:${reset}  ${green}${stats.homoLumoGaps.toLocaleString()}${reset}
${yellow}Frequencies:${reset}     ${green}${stats.frequencies.toLocaleString()}${reset}
${yellow}Total Atoms:${reset}     ${green}${stats.atoms.toLocaleString()}${reset}
${yellow}Files Processed:${reset} ${stats.processedFiles.toLocaleString()}
${yellow}Last Updated:${reset}    ${new Date(stats.lastModified).toLocaleString()}`;
  }

  /**
   * Create a progress bar visualization
   */
  createProgressBar(current: number, max: number, width: number = 20): string {
    const percentage = Math.min(current / max, 1);
    const filled = Math.floor(percentage * width);
    const empty = width - filled;

    const bar = "█".repeat(filled) + "░".repeat(empty);
    const percent = Math.round(percentage * 100);

    return `${bar} ${percent}%`;
  }

  /**
   * Format comparative stats (useful for showing progress over time)
   */
  formatComparativeStats(
    current: KnowledgeGraphStats,
    previous?: KnowledgeGraphStats,
  ): string {
    if (!previous) {
      return this.formatStats(current);
    }

    const changes = {
      molecules: current.molecules - previous.molecules,
      energies: current.scfEnergies - previous.scfEnergies,
      atoms: current.atoms - previous.atoms,
      files: current.processedFiles - previous.processedFiles,
    };

    const formatChange = (change: number): string => {
      if (change > 0) return `📈 +${change}`;
      if (change < 0) return `📉 ${change}`;
      return `➖ 0`;
    };

    return `🧪 **Knowledge Base Update**

⚛️ **Molecules**: ${current.molecules} (${formatChange(changes.molecules)})
⚡ **SCF Energies**: ${current.scfEnergies} (${formatChange(changes.energies)})
🟢 **Atoms**: ${current.atoms} (${formatChange(changes.atoms)})
📄 **Files**: ${current.processedFiles} (${formatChange(changes.files)})`;
  }
}

/**
 * Utility function to create a stats display instance
 */
export function createStatsDisplay(
  options?: MoleculeStatsDisplayOptions,
): MoleculeStatsDisplay {
  return new MoleculeStatsDisplay(options);
}

/**
 * Quick format function for simple use cases
 */
export function formatMoleculeStats(
  stats: KnowledgeGraphStats,
  format: "discord" | "console" | "compact" = "discord",
): string {
  const display = new MoleculeStatsDisplay({
    compact: format === "compact",
  });

  switch (format) {
    case "console":
      return display.formatForConsole(stats);
    case "compact":
      return display.formatStats(stats);
    default:
      return display.formatStats(stats);
  }
}
