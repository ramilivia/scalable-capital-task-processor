import { Task } from '../entities/task.entity';

export class TaskResponseDto {
    id: string;
    type: string;
    status: string;
    payload: any;
    result?: any;
    error?: string;
    created_at: Date;
    updated_at: Date;
    completed_at?: Date;

    static fromEntity(task: Task): TaskResponseDto {
        const dto = new TaskResponseDto();
        dto.id = task.id;
        dto.type = task.type;
        dto.status = task.status;
        dto.payload = task.payload;
        dto.result = task.result;
        dto.error = task.error;
        dto.created_at = task.created_at;
        dto.updated_at = task.updated_at;
        dto.completed_at = task.completed_at;
        return dto;
    }
}
  