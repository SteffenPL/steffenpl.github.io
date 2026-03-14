export type Theme = 'light' | 'dark';

export interface Project {
	slug: string;
	title: string;
	desc: string;
	image: string;
	tags: string[];
	status: 'active' | 'completed';
	start: string;
	end?: string;
	publications: number[];
	links: { label: string; url: string }[];
	blog?: string;
}

export interface Author {
	name: string;
	url?: string;
}

export interface PublicationLink {
	name: string;
	url: string;
}

export interface Publication {
	id: number;
	title: string;
	year: string;
	authors: Author[];
	journal?: string;
	links: PublicationLink[];
}

export interface PublicationsData {
	theses: Publication[];
	preprints: Publication[];
	peer_reviewed: Publication[];
}

export interface Talk {
	date: string;
	title: string;
	venue: string;
	url?: string;
	video?: string;
}

export interface BlogPostMeta {
	slug: string;
	title: string;
	date: string;
	tags?: string[];
}
