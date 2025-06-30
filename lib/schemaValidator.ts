import { supabase } from './supabase';

export interface SchemaValidationResult {
  valid: boolean;
  error?: string;
  data?: any;
}

export const validateVideoGenerationsSchema = async (): Promise<SchemaValidationResult> => {
  try {
    // Test insert with only valid columns
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { valid: false, error: 'Not authenticated' };
    }

    const testRecord = {
      user_id: user.id,
      run_id: null,        // Valid - can be null
      status: 'pending',   // Valid - required field
      script_content: 'Test script for schema validation'  // Valid - optional field
    };

    console.log('🔍 Testing video_generations schema with valid columns only:', testRecord);

    // This should work without foreign key errors
    const { data, error } = await supabase
      .from('video_generations')
      .insert([testRecord])
      .select()
      .single();

    if (error) {
      console.error('❌ Schema validation failed:', error);
      return { valid: false, error: error.message };
    }

    console.log('✅ Schema validation passed:', data);

    // Clean up test record
    await supabase
      .from('video_generations')
      .delete()
      .eq('id', data.id);

    return { valid: true, data };

  } catch (error) {
    console.error('❌ Schema validation error:', error);
    return { 
      valid: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
};

export const checkTableStructure = async (tableName: string): Promise<any[]> => {
  try {
    const { data, error } = await supabase
      .rpc('get_table_columns', { table_name: tableName });

    if (error) {
      console.error(`❌ Error checking ${tableName} structure:`, error);
      return [];
    }

    console.log(`📋 ${tableName} table structure:`, data);
    return data || [];
  } catch (error) {
    console.error(`❌ Error checking ${tableName} structure:`, error);
    return [];
  }
};

export const validateForeignKeyConstraints = async (): Promise<SchemaValidationResult> => {
  try {
    const { data, error } = await supabase
      .rpc('get_foreign_key_constraints', { table_name: 'video_generations' });

    if (error) {
      console.error('❌ Error checking foreign key constraints:', error);
      return { valid: false, error: error.message };
    }

    console.log('🔗 Foreign key constraints for video_generations:', data);
    
    // Check if we have the expected constraints
    const expectedConstraints = ['video_generations_user_id_fkey'];
    const actualConstraints = data?.map((c: any) => c.constraint_name) || [];
    
    const missingConstraints = expectedConstraints.filter(
      constraint => !actualConstraints.includes(constraint)
    );

    if (missingConstraints.length > 0) {
      return { 
        valid: false, 
        error: `Missing foreign key constraints: ${missingConstraints.join(', ')}` 
      };
    }

    return { valid: true, data };
  } catch (error) {
    console.error('❌ Error validating foreign key constraints:', error);
    return { 
      valid: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
};