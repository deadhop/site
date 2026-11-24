// Markdown twin of the relay page, for agents.
import type { APIRoute } from 'astro';
import { relay } from '../../relay/content';
import { toolMarkdown } from '../../tool';

export const GET: APIRoute = () => new Response(toolMarkdown(relay), { headers: { 'Content-Type': 'text/markdown; charset=utf-8' } });
