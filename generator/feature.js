"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_fs_1 = __importDefault(require("node:fs"));
const node_path_1 = __importDefault(require("node:path"));
const args = parseArgs(process.argv.slice(2));
const rawName = (args.name ?? args._[0] ?? '').trim();
if (!rawName) {
    console.error('Please provide a feature name.');
    console.error('Example: npx ts-node generator/feature.ts Users');
    console.error('Example: npx ts-node generator/feature.ts --name RevenueSplits');
    process.exit(1);
}
const featureName = toKebabCase(rawName);
const featurePascal = toPascalCase(rawName);
const featureCamel = toCamelCase(rawName);
const featureTitle = toTitleCase(rawName);
const rootDir = process.cwd();
const moduleDir = node_path_1.default.join(rootDir, 'src', 'modules', featureName);
const dtoDir = node_path_1.default.join(moduleDir, 'dto');
const schemasDir = node_path_1.default.join(moduleDir, 'schemas');
if (node_fs_1.default.existsSync(moduleDir)) {
    console.error(`Feature "${featureName}" already exists at ${moduleDir}`);
    process.exit(1);
}
ensureDir(moduleDir);
ensureDir(dtoDir);
ensureDir(schemasDir);
const files = [
    {
        path: node_path_1.default.join(schemasDir, `${featureName}.schema.ts`),
        content: generateSchemaFile(featurePascal, featureName),
    },
    {
        path: node_path_1.default.join(dtoDir, `create-${featureName}.dto.ts`),
        content: generateCreateDtoFile(featurePascal),
    },
    {
        path: node_path_1.default.join(dtoDir, `update-${featureName}.dto.ts`),
        content: generateUpdateDtoFile(featurePascal, featureName),
    },
    {
        path: node_path_1.default.join(moduleDir, `${featureName}.service.ts`),
        content: generateServiceFile(featurePascal, featureCamel, featureName, featureTitle),
    },
    {
        path: node_path_1.default.join(moduleDir, `${featureName}.controller.ts`),
        content: generateControllerFile(featurePascal, featureCamel, featureName),
    },
    {
        path: node_path_1.default.join(moduleDir, `${featureName}.module.ts`),
        content: generateModuleFile(featurePascal, featureName),
    },
];
for (const file of files) {
    node_fs_1.default.writeFileSync(file.path, file.content, 'utf8');
    console.log(`  created  ${node_path_1.default.relative(rootDir, file.path)}`);
}
registerModuleImport(rootDir, featurePascal, featureName);
console.log(`\nFeature "${featureName}" generated successfully.`);
console.log(`Next: add your fields to schemas/${featureName}.schema.ts and DTOs.`);
function parseArgs(argv) {
    const parsed = { _: [] };
    for (let i = 0; i < argv.length; i++) {
        if (argv[i] === '--name') {
            parsed.name = argv[i + 1];
            i++;
        }
        else {
            parsed._.push(argv[i]);
        }
    }
    return parsed;
}
function ensureDir(dirPath) {
    node_fs_1.default.mkdirSync(dirPath, { recursive: true });
}
function toKebabCase(value) {
    return splitWords(value).join('-').toLowerCase();
}
function toPascalCase(value) {
    return splitWords(value)
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
        .join('');
}
function toCamelCase(value) {
    const p = toPascalCase(value);
    return p.charAt(0).toLowerCase() + p.slice(1);
}
function toTitleCase(value) {
    return splitWords(value)
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
        .join(' ');
}
function splitWords(value) {
    return value
        .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
        .split(/[-_\s]+/)
        .filter(Boolean);
}
function registerModuleImport(rootDir, featurePascal, featureName) {
    const appModulePath = node_path_1.default.join(rootDir, 'src', 'app.module.ts');
    if (!node_fs_1.default.existsSync(appModulePath)) {
        console.warn('\nWarning: src/app.module.ts not found, skipping auto-registration.');
        console.warn(`Manually import ${featurePascal}Module into your AppModule.`);
        return;
    }
    let content = node_fs_1.default.readFileSync(appModulePath, 'utf8');
    const importLine = `import { ${featurePascal}Module } from './modules/${featureName}/${featureName}.module';`;
    if (!content.includes(importLine)) {
        const lines = content.split('\n');
        const lastImportIdx = lines.reduce((idx, line, i) => (line.startsWith('import ') ? i : idx), -1);
        lines.splice(lastImportIdx + 1, 0, importLine);
        content = lines.join('\n');
    }
    if (content.includes(`${featurePascal}Module`)) {
        console.log(`  skipped  ${featurePascal}Module already registered in app.module.ts`);
        node_fs_1.default.writeFileSync(appModulePath, content, 'utf8');
        return;
    }
    const moduleDecoratorIdx = content.indexOf('@Module({');
    if (moduleDecoratorIdx === -1) {
        console.warn('\nWarning: @Module decorator not found. Add manually.');
        return;
    }
    const afterDecorator = content.slice(moduleDecoratorIdx);
    let depth = 0;
    let importsKeyOffset = -1;
    for (let i = 0; i < afterDecorator.length; i++) {
        const ch = afterDecorator[i];
        if (ch === '{' || ch === '[' || ch === '(')
            depth++;
        if (ch === '}' || ch === ']' || ch === ')')
            depth--;
        if (depth === 1 && afterDecorator.slice(i).match(/^imports\s*:/)) {
            importsKeyOffset = i;
            break;
        }
    }
    if (importsKeyOffset === -1) {
        console.warn('\nWarning: Could not locate @Module imports array. Add manually.');
        return;
    }
    const importsKeyIdx = moduleDecoratorIdx + importsKeyOffset;
    const fromImports = content.slice(importsKeyIdx);
    const bracketOpen = fromImports.indexOf('[');
    let bracketDepth = 0;
    let closingBracketOffset = -1;
    for (let i = bracketOpen; i < fromImports.length; i++) {
        if (fromImports[i] === '[')
            bracketDepth++;
        if (fromImports[i] === ']') {
            bracketDepth--;
            if (bracketDepth === 0) {
                closingBracketOffset = i;
                break;
            }
        }
    }
    if (closingBracketOffset === -1) {
        console.warn('\nWarning: Could not find closing ] of imports array. Add manually.');
        return;
    }
    const closingBracketIdx = importsKeyIdx + closingBracketOffset;
    const before = content.slice(0, closingBracketIdx).trimEnd();
    const after = content.slice(closingBracketIdx);
    const needsComma = !before.endsWith('[');
    content = `${before}${needsComma ? ',' : ''}\n    ${featurePascal}Module,\n  ${after}`;
    node_fs_1.default.writeFileSync(appModulePath, content, 'utf8');
    console.log(`  updated  src/app.module.ts`);
}
function generateSchemaFile(featurePascal, featureName) {
    return `import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ${featurePascal}Document = ${featurePascal} & Document;

@Schema({ timestamps: true })
export class ${featurePascal} {
  // TODO: define your fields here
  // @Prop({ required: true })
  // name!: string;
}

export const ${featurePascal}Schema = SchemaFactory.createForClass(${featurePascal});
`;
}
function generateCreateDtoFile(featurePascal) {
    return `import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class Create${featurePascal}Dto {
  // TODO: add fields with class-validator decorators
  // @IsString()
  // @IsNotEmpty()
  // name!: string;
  //
  // @IsString()
  // @IsOptional()
  // description?: string;
}
`;
}
function generateUpdateDtoFile(featurePascal, featureName) {
    return `import { PartialType } from '@nestjs/mapped-types';
import { Create${featurePascal}Dto } from './create-${featureName}.dto';

// PartialType makes all Create fields optional automatically
export class Update${featurePascal}Dto extends PartialType(Create${featurePascal}Dto) {}
`;
}
function generateServiceFile(featurePascal, featureCamel, featureName, featureTitle) {
    return `import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { Create${featurePascal}Dto } from './dto/create-${featureName}.dto';
import { Update${featurePascal}Dto } from './dto/update-${featureName}.dto';
import { ${featurePascal}, ${featurePascal}Document } from './schemas/${featureName}.schema';

@Injectable()
export class ${featurePascal}Service {
  constructor(
    @InjectModel(${featurePascal}.name)
    private readonly ${featureCamel}Model: Model<${featurePascal}Document>,
  ) {}

  async findAll(): Promise<${featurePascal}Document[]> {
    return this.${featureCamel}Model.find().exec();
  }

  async findOne(id: string): Promise<${featurePascal}Document> {
    const doc = await this.${featureCamel}Model.findById(id).exec();
    if (!doc) throw new NotFoundException('${featureTitle} not found');
    return doc;
  }

  async create(payload: Create${featurePascal}Dto): Promise<${featurePascal}Document> {
    const created = new this.${featureCamel}Model(payload);
    return created.save();
  }

  async update(id: string, payload: Update${featurePascal}Dto): Promise<${featurePascal}Document> {
    const updated = await this.${featureCamel}Model
      .findByIdAndUpdate(id, payload, { new: true })
      .exec();
    if (!updated) throw new NotFoundException('${featureTitle} not found');
    return updated;
  }

  async remove(id: string): Promise<{ deleted: true }> {
    const result = await this.${featureCamel}Model.findByIdAndDelete(id).exec();
    if (!result) throw new NotFoundException('${featureTitle} not found');
    return { deleted: true };
  }
}
`;
}
function generateControllerFile(featurePascal, featureCamel, featureName) {
    return `import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';

import { Create${featurePascal}Dto } from './dto/create-${featureName}.dto';
import { Update${featurePascal}Dto } from './dto/update-${featureName}.dto';
import { ${featurePascal}Service } from './${featureName}.service';

@Controller('${featureName}')
export class ${featurePascal}Controller {
  constructor(private readonly ${featureCamel}Service: ${featurePascal}Service) {}

  @Get()
  findAll() {
    return this.${featureCamel}Service.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.${featureCamel}Service.findOne(id);
  }

  @Post()
  create(@Body() payload: Create${featurePascal}Dto) {
    return this.${featureCamel}Service.create(payload);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() payload: Update${featurePascal}Dto) {
    return this.${featureCamel}Service.update(id, payload);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.${featureCamel}Service.remove(id);
  }
}
`;
}
function generateModuleFile(featurePascal, featureName) {
    return `import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { ${featurePascal}Controller } from './${featureName}.controller';
import { ${featurePascal}Service } from './${featureName}.service';
import { ${featurePascal}, ${featurePascal}Schema } from './schemas/${featureName}.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ${featurePascal}.name, schema: ${featurePascal}Schema },
    ]),
  ],
  controllers: [${featurePascal}Controller],
  providers: [${featurePascal}Service],
  exports: [${featurePascal}Service],
})
export class ${featurePascal}Module {}
`;
}
//# sourceMappingURL=feature.js.map