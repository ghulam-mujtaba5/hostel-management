#!/usr/bin/env node

/**
 * MCP (Model Context Protocol) Server for Supabase
 * Provides tools for AI agents to interact with Supabase database
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * MCP Tools Registry
 */
const tools = {
  'db:query': {
    description: 'Execute a SELECT query on Supabase',
    params: {
      table: 'string - Table name',
      columns: 'string - Comma-separated columns (default: *)',
      filters: 'object - Column filters as key-value pairs'
    },
    execute: async (params) => {
      let query = supabase.from(params.table).select(params.columns || '*');
      
      if (params.filters) {
        Object.entries(params.filters).forEach(([key, value]) => {
          query = query.eq(key, value);
        });
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data;
    }
  },

  'db:insert': {
    description: 'Insert records into Supabase table',
    params: {
      table: 'string - Table name',
      records: 'array - Records to insert'
    },
    execute: async (params) => {
      const { data, error } = await supabase
        .from(params.table)
        .insert(params.records);
      if (error) throw error;
      return data;
    }
  },

  'db:update': {
    description: 'Update records in Supabase table',
    params: {
      table: 'string - Table name',
      record: 'object - Updated record data',
      filters: 'object - Filter conditions'
    },
    execute: async (params) => {
      let query = supabase.from(params.table).update(params.record);
      
      if (params.filters) {
        Object.entries(params.filters).forEach(([key, value]) => {
          query = query.eq(key, value);
        });
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data;
    }
  },

  'db:delete': {
    description: 'Delete records from Supabase table',
    params: {
      table: 'string - Table name',
      filters: 'object - Filter conditions (required)'
    },
    execute: async (params) => {
      if (!params.filters || Object.keys(params.filters).length === 0) {
        throw new Error('Filters required for safety - cannot delete without conditions');
      }
      
      let query = supabase.from(params.table).delete();
      
      Object.entries(params.filters).forEach(([key, value]) => {
        query = query.eq(key, value);
      });
      
      const { data, error } = await query;
      if (error) throw error;
      return data;
    }
  },

  'migration:status': {
    description: 'Check database migration status',
    execute: async () => {
      const { data, error } = await supabase
        .from('supabase_migrations')
        .select('name, executed_at')
        .order('executed_at', { ascending: false });
      
      if (error) throw error;
      return data;
    }
  },

  'schema:tables': {
    description: 'List all tables in current schema',
    execute: async () => {
      const { data, error } = await supabase
        .rpc('get_tables');
      
      if (error) {
        // Fallback: query information_schema
        const { data: tables } = await supabase
          .from('information_schema.tables')
          .select('table_name')
          .eq('table_schema', 'public');
        return tables;
      }
      return data;
    }
  },

  'schema:columns': {
    description: 'Get column information for a table',
    params: {
      table: 'string - Table name'
    },
    execute: async (params) => {
      const { data, error } = await supabase
        .from('information_schema.columns')
        .select('column_name, data_type, is_nullable')
        .eq('table_name', params.table);
      
      if (error) throw error;
      return data;
    }
  }
};

/**
 * STDIO transport for MCP
 */
process.stdin.setEncoding('utf-8');

let buffer = '';

process.stdin.on('data', async (chunk) => {
  buffer += chunk;
  
  try {
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';
    
    for (const line of lines) {
      if (!line.trim()) continue;
      
      const message = JSON.parse(line);
      
      if (message.method === 'tools/list') {
        const toolsList = Object.entries(tools).map(([name, tool]) => ({
          name,
          description: tool.description,
          inputSchema: {
            type: 'object',
            properties: tool.params || {}
          }
        }));
        
        console.log(JSON.stringify({ result: toolsList }));
      } else if (message.method === 'tools/call') {
        const tool = tools[message.params.name];
        
        if (!tool) {
          console.log(JSON.stringify({ error: `Unknown tool: ${message.params.name}` }));
          continue;
        }
        
        try {
          const result = await tool.execute(message.params.arguments);
          console.log(JSON.stringify({ result }));
        } catch (error) {
          console.log(JSON.stringify({ error: error.message }));
        }
      }
    }
  } catch (error) {
    console.log(JSON.stringify({ error: error.message }));
  }
});
