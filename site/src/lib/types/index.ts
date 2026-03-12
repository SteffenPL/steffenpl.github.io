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
	preprints: Publication[];
	peer_reviewed: Publication[];
}

export interface Project {
	slug: string;
	title: string;
	description: string;
	image?: string;
	tags: string[];
	links: { label: string; url: string }[];
	publicationIds: number[];
	status: 'active' | 'archived';
	start?: string;
	end?: string;
}

export interface BlogPostMeta {
	slug: string;
	title: string;
	date: string;
	description?: string;
	tags: string[];
}

export interface NavItem {
	name: string;
	route: string;
}
