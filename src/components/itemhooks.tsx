import { useState, useCallback, useEffect } from 'react'
import { usePouch } from 'use-pouchdb'
import { cloneDeep } from 'lodash';

export function useUpdateItem() {
  const db = usePouch();

  return useCallback(
    async (updatedDoc: any) => {
      const result = await db.put(updatedDoc)
      return result
    },
    [db]
  )
}

export function useUpdateCompleted() {
  const db = usePouch();

  return useCallback(
    async (updateInfo: any) => {
      const newItemDoc = cloneDeep(updateInfo.itemDoc);
      for (let i = 0; i < newItemDoc.lists.length; i++) {
        if (updateInfo.updateAll) {
          newItemDoc.lists[i].completed = updateInfo.newStatus;
        } else {
          if (newItemDoc.lists[i].listID == updateInfo.listID) {
            newItemDoc.lists[i].completed = true;
          }
        }   
      }
      const result = await db.put(newItemDoc);
      return result
    },
    [db]
  )
}
