// import { addDoc } from 'firebase/firestore';
// import { collectionData } from 'rxfire/firestore';
import { transferArrayItem, CdkDragDrop } from '@angular/cdk/drag-drop';
import { Component } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import {
  TaskDialogComponent,
  TaskDialogResult,
} from './task-dialog/task-dialog.component';
import { Task } from './task/task';
import {
  Firestore,
  collection,
  collectionData,
  addDoc,
  runTransaction,
  deleteDoc,
  doc,
  updateDoc,
} from '@angular/fire/firestore';
import { Observable} from 'rxjs';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent {
  title = 'kanban-fire';

  constructor(private dialog: MatDialog, private firestore: Firestore) {}

  todoCollection = collection(this.firestore, 'todo');
  todo = collectionData(this.todoCollection, { idField: 'id' }) as Observable<
    Task[]
  >;
  inProgressCollection = collection(this.firestore, 'inProgress');
  inProgress = collectionData(this.inProgressCollection, {
    idField: 'id',
  }) as Observable<Task[]>;
  doneCollection = collection(this.firestore, 'done');
  done = collectionData(this.doneCollection, { idField: 'id' }) as Observable<
    Task[]
  >;

  newTask(): void {
    const dialogRef = this.dialog.open(TaskDialogComponent, {
      width: '270px',
      data: {
        task: {},
      },
    });
    dialogRef
      .afterClosed()
      .subscribe((result: TaskDialogResult | undefined) => {
        if (!result) {
          return;
        }
        addDoc(this.todoCollection, result.task);
      });
  }

  editTask(list: 'done' | 'todo' | 'inProgress', task: Task): void {
    const dialogRef = this.dialog.open(TaskDialogComponent, {
      width: '270px',
      data: {
        task,
        enableDelete: true,
      },
    });
    dialogRef
      .afterClosed()
      .subscribe((result: TaskDialogResult | undefined) => {
        if (!result) {
          return;
        }
        const docRef = doc(
          this.firestore,
          `${collection(this.firestore, list).path}/${task.id}`
        );
        if (result.delete) {
          deleteDoc(docRef);
        } else {
          updateDoc(docRef, { task: task });
        } 
      });
  }
  drop(event: CdkDragDrop<Task[] | null>): void {
    if (!event.container.data || !event.previousContainer.data) {
      return;
    }
    if (event.previousContainer === event.container) {
      return;
    }
    const item = event.previousContainer.data[event.previousIndex];
    console.log(typeof this.todoCollection, item);
    const docRef = doc(
      this.firestore,
      `${event.previousContainer.id}/${item.id}`
    );
    const collectionRef = collection(this.firestore, event.container.id);
    runTransaction(this.firestore, () => {
      const promise = Promise.all([
        deleteDoc(docRef),
        addDoc(collectionRef, item),
      ]);
      return promise;
    });

    transferArrayItem(
      event.previousContainer.data,
      event.container.data,
      event.previousIndex,
      event.currentIndex
    );
  }
}
