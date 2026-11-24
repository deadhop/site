// Markdown twin of the lnaddr page, for agents.
import type { APIRoute } from 'astro';
import { lnaddr } from '../../lnaddr/content';
import { toolMarkdown } from '../../tool';

export const GET: APIRoute = () => new Response(toolMarkdown(lnaddr), { headers: { 'Content-Type': 'text/markdown; charset=utf-8' } });
