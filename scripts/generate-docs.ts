import swaggerJsdoc from 'swagger-jsdoc';
import { readdirSync } from 'fs';
import path from 'path';

// Swagger definition
const swaggerDef = {
  openapi: '3.0.0',
  info: {
    title: 'ResumeBoost API',
    version: '1.0.0',
    description: 'Complete API for ResumeBoost application with real database integration',
    contact: {
      name: 'ResumeBoost Team',
      email: 'support@resumeboost.com'
    }
  },
  servers: [
    {
      url: 'http://localhost:3000',
      description: 'Development server'
    },
    {
      url: 'https://resumeboost.vercel.app',
      description: 'Production server'
    }
  ],
  paths: {},
  components: {
    schemas: {
      User: {
        type: 'object',
        required: ['email', 'password_hash'],
        properties: {
          user_id: {
            type: 'integer',
            description: 'Unique identifier for the user'
          },
          email: {
            type: 'string',
            format: 'email',
            description: 'User email address'
          },
          password_hash: {
            type: 'string',
            description: 'Hashed password'
          },
          first_name: {
            type: 'string',
            description: 'User first name'
          },
          last_name: {
            type: 'string',
            description: 'User last name'
          },
          created_at: {
            type: 'string',
            format: 'date-time',
            description: 'When the user was created'
          },
          updated_at: {
            type: 'string',
            format: 'date-time',
            description: 'When the user was last updated'
          }
        }
      },
      Upload: {
        type: 'object',
        required: ['user_id', 'file_name', 'file_path', 'file_size', 'mime_type'],
        properties: {
          upload_id: {
            type: 'integer',
            description: 'Unique identifier for the upload'
          },
          user_id: {
            type: 'integer',
            description: 'User who uploaded the file'
          },
          file_name: {
            type: 'string',
            description: 'Name of the uploaded file'
          },
          file_path: {
            type: 'string',
            description: 'Path where file is stored'
          },
          file_size: {
            type: 'integer',
            description: 'Size of the file in bytes'
          },
          mime_type: {
            type: 'string',
            description: 'MIME type of the file'
          },
          upload_status: {
            type: 'string',
            enum: ['uploaded', 'processing', 'completed', 'failed'],
            description: 'Status of the upload'
          },
          created_at: {
            type: 'string',
            format: 'date-time',
            description: 'When the file was uploaded'
          }
        }
      },
      Analysis: {
        type: 'object',
        required: ['upload_id', 'user_id', 'analysis_data'],
        properties: {
          analysis_id: {
            type: 'integer',
            description: 'Unique identifier for the analysis'
          },
          upload_id: {
            type: 'integer',
            description: 'Upload being analyzed'
          },
          user_id: {
            type: 'integer',
            description: 'User who requested the analysis'
          },
          analysis_data: {
            type: 'object',
            description: 'Analysis results and data'
          },
          score: {
            type: 'integer',
            minimum: 0,
            maximum: 100,
            description: 'Analysis score from 0-100'
          },
          recommendations: {
            type: 'object',
            description: 'Recommendations based on analysis'
          },
          created_at: {
            type: 'string',
            format: 'date-time',
            description: 'When the analysis was created'
          }
        }
      },
      ApiResponse: {
        type: 'object',
        properties: {
          success: {
            type: 'boolean',
            description: 'Whether the request was successful'
          },
          data: {
            type: 'object',
            description: 'Response data'
          },
          error: {
            type: 'object',
            properties: {
              code: {
                type: 'string',
                description: 'Error code'
              },
              message: {
                type: 'string',
                description: 'Error message'
              }
            }
          },
          meta: {
            type: 'object',
            properties: {
              timestamp: {
                type: 'string',
                format: 'date-time',
                description: 'Response timestamp'
              },
              count: {
                type: 'integer',
                description: 'Number of items in response'
              }
            }
          }
        },
        required: ['success']
      }
    }
  }
};

// Find all API route files
const apiDir = path.join(__dirname, 'app/api');
const routeFiles = readdirSync(apiDir, { withFileTypes: true })
  .filter(file => file.isFile() && file.name === 'route.ts')
  .map(file => path.join(apiDir, file.name));

// Process each API route file
routeFiles.forEach(routeFile => {
  const content = require(routeFile);
  const routePath = routeFile.replace(path.join(__dirname, 'app/api/'), '').replace(/\\/g, '').replace('.ts', '');
  
  // Extract API documentation from JSDoc comments
  const docComments = content.toString().match(/\/\*\*\s*@swagger\s+([^*]+)\s*\*\//g);
  
  if (docComments) {
    try {
      const swaggerDoc = JSON.parse(docComments[1].trim());
      swaggerDef.paths[routePath] = swaggerDoc.paths || {};
      
      // Add methods from exports
      if (content.GET) swaggerDef.paths[routePath].get = {
        summary: `GET ${routePath}`,
        description: swaggerDoc.description || `Get ${routePath} endpoint`,
        tags: swaggerDoc.tags || [routePath.split('/')[0]],
        responses: {
          '200': {
            description: 'Successful response',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ApiResponse' }
              }
            }
          }
        }
      };
      
      if (content.POST) swaggerDef.paths[routePath].post = {
        summary: `POST ${routePath}`,
        description: `Create ${routePath} endpoint`,
        tags: swaggerDoc.tags || [routePath.split('/')[0]],
        responses: {
          '201': {
            description: 'Resource created successfully',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ApiResponse' }
              }
            }
          },
          '400': {
            description: 'Bad request',
            content: {
              'application/json': {
                schema: { $ref: 'success: false' }
              }
            }
          }
        }
      };
      
      // Add PUT and DELETE if they exist
      if (content.PUT) swaggerDef.paths[routePath].put = {
        summary: `PUT ${routePath}`,
        description: `Update ${routePath} endpoint`,
        tags: swaggerDoc.tags || [routePath.split('/')[0]],
        responses: {
          '200': {
            description: 'Resource updated successfully',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ApiResponse' }
              }
            }
          }
        }
      };
      
      if (content.DELETE) swaggerDef.paths[routePath].delete = {
        summary: `DELETE ${routePath}`,
        description: `Delete ${routePath} endpoint`,
        tags: swaggerDoc.tags || [routePath.split('/')[0]],
        responses: {
          '200': {
            description: 'Resource deleted successfully',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ApiResponse' }
              }
            }
          }
        }
      };
    } catch (error) {
      console.warn(`Failed to parse swagger doc for ${routePath}:`, error);
    }
  }
});

// Generate the final Swagger JSON
const swaggerJson = JSON.stringify(swaggerDef, null, 2);

console.log('API Documentation Generated:');
console.log('Save this as docs/api.json or use with Swagger UI');

// Write to file
require('fs').writeFileSync(path.join(__dirname, '../docs/api.json'), swaggerJson);

export default swaggerDef;
